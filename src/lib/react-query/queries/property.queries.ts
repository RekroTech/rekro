/**
 * Direct Supabase queries for properties
 * Following Next.js 15 + Supabase best practices:
 * - Simple reads: Direct Supabase calls
 * - Complex mutations: Use API routes
 */

import { createClient } from "@/lib/supabase/client";
import type { Property, GetPropertiesParams, GetPropertiesResponse } from "@/types/property.types";
import type { Unit } from "@/types/db";

/**
 * Bulk fetch likes for multiple units efficiently
 */
async function getBulkUnitLikes(unitIds: string[], userId: string): Promise<Set<string>> {
    if (!unitIds.length || !userId) {
        return new Set();
    }

    const supabase = createClient();

    const { data: likes, error } = await supabase
        .from("unit_likes")
        .select("unit_id")
        .eq("user_id", userId)
        .in("unit_id", unitIds);

    if (error) {
        console.error("Error fetching bulk unit likes:", error);
        return new Set();
    }

    return new Set(likes?.map((like) => like.unit_id) || []);
}

/**
 * Fetch properties with filtering and pagination
 * Direct Supabase call - no service layer needed
 */
export async function getProperties(
    params: GetPropertiesParams = {}
): Promise<GetPropertiesResponse> {
    const supabase = createClient();
    const {
        limit = 12,
        offset = 0,
        isPublished = true,
        userId,
        likedOnly = false,
        search,
        propertyType,
        minBedrooms,
        minBathrooms,
        furnished,
        listingType,
    } = params;

    // Always fetch units with properties to avoid N+1 query problem
    const unitColumns =
        "id, listing_type, name, description, price, bond_amount, bills_included, min_lease, max_lease, max_occupants, size_sqm, is_active, available_from, available_to, is_available";

    // Use inner join for filtering by liked properties or listing type
    const selectQuery =
        listingType || likedOnly ? `*, units!inner(${unitColumns})` : `*, units(${unitColumns})`;

    let query = supabase
        .from("properties")
        .select(selectQuery, { count: "exact" })
        .order("created_at", { ascending: false });

    // Filter by liked properties only
    if (likedOnly && userId) {
        const { data: likedUnits } = await supabase
            .from("unit_likes")
            .select("unit_id")
            .eq("user_id", userId);

        const likedUnitIds = likedUnits?.map((like) => like.unit_id) || [];

        if (likedUnitIds.length === 0) {
            return {
                data: [],
                nextOffset: null,
                hasMore: false,
            };
        }

        query = query.in("units.id", likedUnitIds);
    }

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
        throw new Error(error.message);
    }

    // Process the data to handle units properly
    let properties: Property[] = data ?? [];

    // Handle duplicate properties when using inner join
    if (listingType && properties.length > 0) {
        const propertyMap = new Map<string, Property>();

        properties.forEach((prop: Property) => {
            if (!propertyMap.has(prop.id)) {
                const { units, ...propertyData } = prop;
                propertyMap.set(prop.id, {
                    ...propertyData,
                    units: Array.isArray(units) ? units : [units],
                } as Property);
            } else {
                const existingProp = propertyMap.get(prop.id)!;
                const newUnits = Array.isArray(prop.units) ? prop.units : [prop.units];
                existingProp.units.push(...newUnits);
            }
        });

        properties = Array.from(propertyMap.values());
    } else {
        properties = properties.map((prop) => ({
            ...prop,
            units: prop.units || [],
        }));
    }

    // Sort units: entire_home first, then rooms by name
    properties = properties.map((prop) => ({
        ...prop,
        units:
            prop.units?.sort((a: Unit, b: Unit) => {
                if (a.listing_type !== b.listing_type) {
                    return a.listing_type === "entire_home" ? -1 : 1;
                }
                const nameA = a.name || "";
                const nameB = b.name || "";
                return nameA.localeCompare(nameB, undefined, { numeric: true });
            }) || [],
    }));

    // Bulk fetch likes if userId is provided
    if (userId && properties.length > 0) {
        const allUnitIds = properties.flatMap(
            (prop) => prop.units?.map((unit: Unit) => unit.id) || []
        );

        if (allUnitIds.length > 0) {
            const likedUnitIds = await getBulkUnitLikes(allUnitIds, userId);

            properties = properties.map((prop) => ({
                ...prop,
                units:
                    prop.units?.map((unit: Unit) => ({
                        ...unit,
                        isLiked: likedUnitIds.has(unit.id),
                    })) || [],
            }));
        }
    }

    const total = count ?? 0;
    const nextOffset = offset + limit;
    const hasMore = nextOffset < total;

    return {
        data: properties,
        nextOffset: hasMore ? nextOffset : null,
        hasMore,
    };
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(id: string): Promise<Property> {
    const supabase = createClient();

    const { data: property, error } = await supabase
        .from("properties")
        .select(
            `
            *,
            units!inner (
                *
            )
        `
        )
        .eq("id", id)
        .eq("units.is_active", true)
        .order("listing_type", { referencedTable: "units", ascending: true })
        .order("name", { referencedTable: "units", ascending: true })
        .single();

    if (error) {
        console.error("Error fetching property:", error);
        throw new Error(error.message);
    }

    return property;
}