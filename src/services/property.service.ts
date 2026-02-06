import { createClient } from "@/lib/supabase/client";
import { PropertyInsert } from "@/types/db";
import { Property, GetPropertiesParams, GetPropertiesResponse, Unit } from "@/types/property.types";

export async function getPropertiesClient(
    params: GetPropertiesParams = {}
): Promise<GetPropertiesResponse> {
    const supabase = createClient();
    const {
        limit = 12,
        offset = 0,
        isPublished = true,
        userId,
        search,
        propertyType,
        minBedrooms,
        minBathrooms,
        furnished,
        listingType,
    } = params;

    // Always fetch units with properties to avoid N+1 query problem
    // If listingType filter is applied, use inner join to filter
    const selectQuery = listingType
        ? "*, units!inner(id, listing_type, name, description, price_per_week, bond_amount, bills_included, min_lease_weeks, max_lease_weeks, max_occupants, size_sqm, is_active)"
        : "*, units(id, listing_type, name, description, price_per_week, bond_amount, bills_included, min_lease_weeks, max_lease_weeks, max_occupants, size_sqm, is_active)";

    let query = supabase
        .from("properties")
        .select(selectQuery, { count: "exact" })
        .order("created_at", { ascending: false });

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
        // Search in title, description, and address fields
        // Note: For JSONB fields like address, we need to search within the JSON structure
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

    if (listingType && properties.length > 0) {
        // When using inner join for listing type filter, we may get duplicate properties
        // Group by property ID and collect all units
        const propertyMap = new Map<string, Property>();

        properties.forEach((prop: Property) => {
            if (!propertyMap.has(prop.id)) {
                const { units, ...propertyData } = prop;
                propertyMap.set(prop.id, {
                    ...propertyData,
                    units: Array.isArray(units) ? units : [units],
                } as Property);
            } else {
                // Add units to existing property
                const existingProp = propertyMap.get(prop.id)!;
                const newUnits = Array.isArray(prop.units) ? prop.units : [prop.units];
                existingProp.units.push(...newUnits);
            }
        });

        properties = Array.from(propertyMap.values());
    } else {
        // Ensure all properties have units array (empty if none)
        properties = properties.map((prop) => ({
            ...prop,
            units: prop.units || [],
        }));
    }

    // Bulk fetch likes if userId is provided
    if (userId && properties.length > 0) {
        const allUnitIds = properties.flatMap(
            (prop) => prop.units?.map((unit: Unit) => unit.id) || []
        );

        if (allUnitIds.length > 0) {
            const likedUnitIds = await getBulkPropertyLikes(allUnitIds, userId);

            // Add isLiked flag to all units
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

export async function getPropertyByIdClient(id: string): Promise<Property> {
    const supabase = createClient();

    // Fetch property with units and unit availability in a single query
    const { data: property, error } = await supabase
        .from("properties")
        .select(
            `
            *,
            units!inner (
                *,
                unit_availability (
                    id,
                    available_from,
                    available_to,
                    is_available,
                    notes
                )
            )
        `
        )
        .eq("id", id)
        .eq("units.is_active", true)
        .order("listing_type", { referencedTable: "units", ascending: true })
        .single();

    if (error) {
        console.error("Error fetching property:", error);
        throw new Error(error.message);
    }

    return property;
}

export async function createPropertyClient(
    propertyData: Omit<PropertyInsert, "id" | "created_at" | "updated_at">
): Promise<Property> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

    if (error) {
        console.error("Error creating property:", error);
        throw new Error(error.message);
    }

    return data;
}

export async function updatePropertyClient(
    id: string,
    propertyData: Partial<Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "created_by">>
): Promise<Property> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("properties")
        .update(propertyData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating property:", error);
        throw new Error(error.message);
    }

    return data;
}

// Property Likes Functions
export async function checkPropertyLiked(unitId: string): Promise<boolean> {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data, error } = await supabase
        .from("property_likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("unit_id", unitId)
        .maybeSingle();

    if (error) {
        console.error("Error checking property like:", error);
        return false;
    }

    return !!data;
}

/**
 * Bulk fetch likes for multiple units efficiently
 * Used to add isLiked flags to property lists
 */
export async function getBulkPropertyLikes(
    unitIds: string[],
    userId: string
): Promise<Set<string>> {
    if (!unitIds.length || !userId) {
        return new Set();
    }

    const supabase = createClient();

    const { data: likes, error } = await supabase
        .from("property_likes")
        .select("unit_id")
        .eq("user_id", userId)
        .in("unit_id", unitIds);

    if (error) {
        console.error("Error fetching bulk property likes:", error);
        return new Set();
    }

    return new Set(likes?.map((like) => like.unit_id) || []);
}

export async function togglePropertyLike(unitId: string): Promise<boolean> {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User must be authenticated to like properties");
    }

    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
        .from("property_likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("unit_id", unitId)
        .maybeSingle();

    if (checkError) {
        console.error("Error checking property like:", checkError);
        throw new Error(checkError.message);
    }

    if (existingLike) {
        // Unlike - delete the record
        const { error } = await supabase
            .from("property_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("unit_id", unitId);

        if (error) {
            console.error("Error unliking property:", error);
            throw new Error(error.message);
        }

        return false;
    } else {
        // Like - insert new record
        const { error } = await supabase
            .from("property_likes")
            .insert({ user_id: user.id, unit_id: unitId });

        if (error) {
            console.error("Error liking property:", error);
            throw new Error(error.message);
        }

        return true;
    }
}
