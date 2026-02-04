import { createClient } from "@/lib/supabase/client";
import { Unit, UnitInsert } from "@/types/db";

export async function createUnitClient(
    unitData: Omit<UnitInsert, "id" | "created_at">
): Promise<Unit> {
    const supabase = createClient();
    const { data, error } = await supabase.from("units").insert([unitData]).select().single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function updateUnitClient(
    id: string,
    unitData: Partial<Omit<UnitInsert, "id" | "created_at" | "property_id">>
): Promise<Unit> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("units")
        .update(unitData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating unit:", error);
        throw new Error(error.message);
    }

    return data;
}

export async function getUnitByPropertyIdClient(propertyId: string): Promise<Unit | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // No unit found
            return null;
        }
        console.error("Error fetching unit:", error);
        throw new Error(error.message);
    }

    return data;
}

export async function getUnitsByPropertyIdClient(propertyId: string): Promise<Unit[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_active", true)
        .order("listing_type", { ascending: true });

    if (error) {
        console.error("Error fetching units:", error);
        throw new Error(error.message);
    }

    return data ?? [];
}

export async function checkUnitLiked(unitId: string): Promise<boolean> {
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
        .eq("unit_id", unitId)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error checking unit like:", error);
        return false;
    }

    return !!data;
}

export async function toggleUnitLike(unitId: string): Promise<boolean> {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User must be authenticated to like units");
    }

    // Check if already liked
    const { data: existingLike } = await supabase
        .from("property_likes")
        .select("*")
        .eq("user_id", user.id)
        .eq("unit_id", unitId)
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from("property_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("unit_id", unitId);

        if (error) {
            console.error("Error unliking unit:", error);
            throw new Error(error.message);
        }

        return false;
    } else {
        // Like
        const { error } = await supabase
            .from("property_likes")
            .insert([{ user_id: user.id, unit_id: unitId }]);

        if (error) {
            console.error("Error liking unit:", error);
            throw new Error(error.message);
        }

        return true;
    }
}
