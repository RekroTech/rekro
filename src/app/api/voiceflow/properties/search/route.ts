import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import type { Address, Location as PropertyLocation, Property, Unit } from "@/types/db";

/**
 * GET /api/voiceflow/properties/search
 * Search properties for Voiceflow integration
 *
 * Query Parameters:
 * - search: string (search in title, description, address)
 * - location: string (search in city, suburb, state)
 * - minPrice: number (minimum weekly rent)
 * - maxPrice: number (maximum weekly rent)
 * - bedrooms: number (minimum bedrooms)
 * - bathrooms: number (minimum bathrooms)
 * - propertyType: string (house, apartment, studio, etc.)
 * - listingType: string (entire_home, room)
 * - furnished: boolean
 * - amenities: string (comma-separated list)
 * - availableFrom: date (YYYY-MM-DD)
 * - limit: number (max results, default 5)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        // Extract search parameters
        const search = searchParams.get("search");
        const location = searchParams.get("location");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const bedrooms = searchParams.get("bedrooms");
        const bathrooms = searchParams.get("bathrooms");
        const propertyType = searchParams.get("propertyType");
        const listingType = searchParams.get("listingType");
        const furnished = searchParams.get("furnished");
        const amenities = searchParams.get("amenities");
        const availableFrom = searchParams.get("availableFrom");
        const limit = parseInt(searchParams.get("limit") || "5");

        // Build the query
        const unitColumns = "id, listing_type, name, description, price, bond_amount, min_lease, max_lease, max_occupants, size_sqm, is_active, available_from, available_to, is_available";

        let query = supabase
            .from("properties")
            .select(`*, units!inner(${unitColumns})`)
            .eq("is_published", true)
            .eq("units.is_active", true)
            .eq("units.is_available", true)
            .order("created_at", { ascending: false })
            .limit(limit);

        // Apply filters only if parameters are provided
        if (search && search.trim() !== "") {
            // Tokenise so a full Places address ("100 Castlereagh St, Liverpool NSW 2170, Australia")
            // matches individual fields like suburb="Liverpool" or state="NSW".
            const tokens = [
                ...new Set(
                    search.trim()
                        .split(/[\s,]+/)
                        .map(t => t.replace(/"/g, "").trim())
                        .filter(t => t.length >= 3)
                ),
            ].slice(0, 12);

            const searchFields = [
                "title", "description",
                "address->>street", "address->>city",
                "address->>state", "address->>suburb",
            ];
            const conditions = tokens.flatMap(token =>
                searchFields.map(f => `${f}.ilike."%${token}%"`)
            );
            if (conditions.length > 0) query = query.or(conditions.join(","));
        }

        if (location && location.trim() !== "") {
            const tokens = [
                ...new Set(
                    location.trim()
                        .split(/[\s,]+/)
                        .map(t => t.replace(/"/g, "").trim())
                        .filter(t => t.length >= 3)
                ),
            ].slice(0, 8);

            const locationFields = [
                "address->>city", "address->>suburb", "address->>state",
                "location->>city", "location->>state",
            ];
            const conditions = tokens.flatMap(token =>
                locationFields.map(f => `${f}.ilike."%${token}%"`)
            );
            if (conditions.length > 0) query = query.or(conditions.join(","));
        }

        if (propertyType) {
            query = query.eq("property_type", propertyType);
        }

        if (bedrooms) {
            const bedroomsNum = parseInt(bedrooms);
            if (!isNaN(bedroomsNum)) {
                query = query.gte("bedrooms", bedroomsNum);
            }
        }

        if (bathrooms) {
            const bathroomsNum = parseInt(bathrooms);
            if (!isNaN(bathroomsNum)) {
                query = query.gte("bathrooms", bathroomsNum);
            }
        }

        if (furnished === "true") {
            query = query.eq("furnished", true);
        }

        if (listingType && (listingType === "entire_home" || listingType === "room")) {
            query = query.eq("units.listing_type", listingType);
        }

        if (amenities && amenities.trim() !== "") {
            const amenitiesList = amenities.split(",").map(a => a.trim());
            query = query.contains("amenities", amenitiesList);
        }

        if (availableFrom) {
            query = query.or(`units.available_from.lte.${availableFrom},units.available_from.is.null`);
        }

        // Price filtering on units
        if (minPrice) {
            const minPriceNum = parseInt(minPrice);
            if (!isNaN(minPriceNum)) {
                query = query.gte("units.price", minPriceNum);
            }
        }

        if (maxPrice) {
            const maxPriceNum = parseInt(maxPrice);
            if (!isNaN(maxPriceNum)) {
                query = query.lte("units.price", maxPriceNum);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error searching properties:", error);
            return errorResponse(error.message, 500);
        }

        // Process and deduplicate properties (inner join can create duplicates)
        type PropertyWithUnits = Property & { units: Unit[] };
        const propertyMap = new Map<string, PropertyWithUnits>();

        (data || []).forEach((prop: PropertyWithUnits) => {
            if (!propertyMap.has(prop.id)) {
                const { units, ...propertyData } = prop;
                propertyMap.set(prop.id, {
                    ...propertyData,
                    units: Array.isArray(units) ? units : [units],
                } as PropertyWithUnits);
            } else {
                const existingProp = propertyMap.get(prop.id)!;
                const newUnits = Array.isArray(prop.units) ? prop.units : [prop.units];
                existingProp.units.push(...newUnits);
            }
        });

        const properties = Array.from(propertyMap.values());

        // Format response for Voiceflow
        const formattedProperties = properties.map(property => {
            const address = property.address as Address | null;
            const location = property.location as PropertyLocation | null;

            // Calculate price range from units
            const prices = property.units.map(u => u.price);
            const minUnitPrice = Math.min(...prices);
            const maxUnitPrice = Math.max(...prices);

            return {
                id: property.id,
                description: property.description,
                address: address ? {
                    street: address.street,
                    suburb: address.suburb,
                    city: address.city,
                    state: address.state,
                    postcode: address.postcode,
                    fullAddress: `${address.street}, ${address.suburb || address.city}, ${address.state} ${address.postcode}`
                } : null,
                location: location ? {
                    city: location.city,
                    state: location.state,
                    country: location.country
                } : null,
                propertyType: property.property_type,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                carSpaces: property.car_spaces,
                furnished: property.furnished,
                billsIncluded: property.bills_included,
                amenities: property.amenities || [],
                images: property.images || [],
                videoUrl: property.video_url,
                priceRange: prices.length > 1 && minUnitPrice !== maxUnitPrice
                    ? `$${minUnitPrice} - $${maxUnitPrice} per week`
                    : `$${minUnitPrice} per week`,
                minPrice: minUnitPrice,
                maxPrice: maxUnitPrice,
                availableUnits: property.units.length,
                units: property.units.map(unit => ({
                    id: unit.id,
                    name: unit.name,
                    listingType: unit.listing_type,
                    description: unit.description,
                    price: unit.price,
                    priceFormatted: `$${unit.price} per week`,
                    bondAmount: unit.bond_amount,
                    minLease: unit.min_lease,
                    maxLease: unit.max_lease,
                    maxOccupants: unit.max_occupants,
                    sizeSqm: unit.size_sqm,
                    availableFrom: unit.available_from,
                    availableTo: unit.available_to,
                    isAvailable: unit.is_available,
                })),
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rekro.com.au'}/property/${property.id}`,
            };
        });

        return successResponse({
            properties: formattedProperties,
            count: formattedProperties.length,
            searchParams: {
                search,
                location,
                minPrice,
                maxPrice,
                bedrooms,
                bathrooms,
                propertyType,
                listingType,
                furnished,
                amenities,
                availableFrom,
                limit,
            }
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        console.error("Error in GET /api/voiceflow/properties/search:", error);
        return errorResponse(message, 500);
    }
}

