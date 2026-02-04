import { createClient } from "@/lib/supabase/client";
import { Property, PropertyInsert, Unit } from "@/types/db";

export interface PropertyWithUnits extends Property {
    units: Unit[];
}

export interface GetPropertiesParams {
    limit?: number;
    offset?: number;
    isPublished?: boolean;
    // New optional filters
    search?: string;
    propertyType?: string;
    minBedrooms?: number;
    minBathrooms?: number;
    furnished?: boolean;
}

export interface GetPropertiesResponse {
    data: Property[];
    nextOffset: number | null;
    hasMore: boolean;
}

export async function getPropertiesClient(
    params: GetPropertiesParams = {}
): Promise<GetPropertiesResponse> {
    const supabase = createClient();
    const {
        limit = 12,
        offset = 0,
        isPublished = true,
        search,
        propertyType,
        minBedrooms,
        minBathrooms,
        furnished,
    } = params;

    let query = supabase
        .from("properties")
        .select("*", { count: "exact" })
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

    const total = count ?? 0;
    const nextOffset = offset + limit;
    const hasMore = nextOffset < total;

    return {
        data: data ?? [],
        nextOffset: hasMore ? nextOffset : null,
        hasMore,
    };
}

export async function getPropertyByIdClient(id: string): Promise<PropertyWithUnits> {
    const supabase = createClient();

    const { data: property, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching property:", error);
        throw new Error(error.message);
    }

    // Fetch units for this property
    const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", id)
        .eq("is_active", true)
        .order("listing_type", { ascending: true });

    if (unitsError) {
        console.error("Error fetching units:", unitsError);
        // Don't throw, just return empty units array
    }

    return {
        ...property,
        units: units || [],
    };
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
export async function checkPropertyLiked(propertyId: string): Promise<boolean> {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data, error } = await supabase
        .from("property_likes")
        .select("*")
        .eq("user_id", user.id)
        .eq("unit_id", propertyId)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error checking property like:", error);
        return false;
    }

    return !!data;
}

export async function togglePropertyLike(propertyId: string): Promise<boolean> {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User must be authenticated to like properties");
    }

    // Check if already liked
    const { data: existingLike } = await supabase
        .from("property_likes")
        .select("*")
        .eq("user_id", user.id)
        .eq("unit_id", propertyId)
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from("property_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("unit_id", propertyId);

        if (error) {
            console.error("Error unliking property:", error);
            throw new Error(error.message);
        }

        return false;
    } else {
        // Like
        const { error } = await supabase
            .from("property_likes")
            .insert([{ user_id: user.id, unit_id: propertyId }]);

        if (error) {
            console.error("Error liking property:", error);
            throw new Error(error.message);
        }

        return true;
    }
}
