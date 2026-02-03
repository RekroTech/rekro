import { createClient } from "@/lib/supabase/client";
import { Property, PropertyInsert } from "@/types/db";

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

export async function getPropertyByIdClient(id: string): Promise<Property> {
    const supabase = createClient();

    const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();

    if (error) {
        console.error("Error fetching property:", error);
        throw new Error(error.message);
    }

    return data;
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
