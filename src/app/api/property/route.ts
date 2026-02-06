import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";

// Enable edge runtime for better performance
export const runtime = "nodejs";

/**
 * GET /api/property
 * Fetch properties with filtering and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = request.nextUrl;

        // Parse query parameters
        const limit = parseInt(searchParams.get("limit") || "12", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);
        const isPublished = searchParams.get("isPublished") !== "false";
        const search = searchParams.get("search") || undefined;
        const propertyType = searchParams.get("propertyType") || undefined;
        const minBedrooms = searchParams.get("minBedrooms")
            ? parseInt(searchParams.get("minBedrooms")!, 10)
            : undefined;
        const minBathrooms = searchParams.get("minBathrooms")
            ? parseInt(searchParams.get("minBathrooms")!, 10)
            : undefined;
        const furnished = searchParams.get("furnished") === "true" ? true : undefined;
        const listingType = searchParams.get("listingType") || undefined;

        // Build query - if filtering by listing type, join with units
        const selectQuery = listingType ? "*, units!inner(listing_type)" : "*";

        let query = supabase
            .from("properties")
            .select(selectQuery, { count: "exact" })
            .order("created_at", { ascending: false });

        // Apply filters
        if (isPublished !== undefined) {
            query = query.eq("is_published", isPublished);
        }

        if (propertyType) {
            query = query.eq("property_type", propertyType);
        }

        if (typeof minBedrooms === "number" && !isNaN(minBedrooms)) {
            query = query.gte("bedrooms", minBedrooms);
        }

        if (typeof minBathrooms === "number" && !isNaN(minBathrooms)) {
            query = query.gte("bathrooms", minBathrooms);
        }

        if (furnished === true) {
            query = query.eq("furnished", true);
        }

        // Filter by listing type from units table
        if (listingType) {
            query = query.eq("units.listing_type", listingType);
        }

        if (search && search.trim() !== "") {
            const term = `%${search.trim()}%`;
            query = query.or(
                `title.ilike.${term},description.ilike.${term},address->>street.ilike.${term},address->>city.ilike.${term},address->>state.ilike.${term},address->>suburb.ilike.${term}`
            );
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching properties:", error);
            return errorResponse(error.message, 500);
        }

        // If we joined with units, we need to remove the units data and get unique properties
        let properties = data ?? [];
        if (listingType && properties.length > 0) {
            const uniquePropertyMap = new Map();
            properties.forEach((prop: any) => {
                if (!uniquePropertyMap.has(prop.id)) {
                    const { units, ...propertyData } = prop;
                    uniquePropertyMap.set(prop.id, propertyData);
                }
            });
            properties = Array.from(uniquePropertyMap.values());
        }

        const total = count ?? 0;
        const nextOffset = offset + limit;
        const hasMore = nextOffset < total;

        return successResponse(
            {
                properties: properties,
                nextOffset: hasMore ? nextOffset : null,
                hasMore,
                total,
            },
            200,
            {
                // Cache for 2 minutes with revalidation
                cacheControl: "public, max-age=120, stale-while-revalidate=240",
            }
        );
    } catch (error) {
        console.error("Error in GET /api/property:", error);
        return errorResponse("Internal server error", 500);
    }
}

/**
 * POST /api/property
 * Create a new property (authenticated users only)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return errorResponse("Unauthorized", 401);
        }

        const body = await request.json();

        // Create property
        const { data: property, error } = await supabase
            .from("properties")
            .insert({
                ...body,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating property:", error);
            return errorResponse(error.message, 500);
        }

        return successResponse(property, 201);
    } catch (error) {
        console.error("Error in POST /api/property:", error);
        return errorResponse("Internal server error", 500);
    }
}
