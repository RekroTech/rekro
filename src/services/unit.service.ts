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

export async function deleteUnitClient(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from("units").delete().eq("id", id);

    if (error) {
        console.error("Error deleting unit:", error);
        throw new Error(error.message);
    }
}

/**
 * Batch upsert units (create new + update existing in one call)
 * Units with id will be updated, units without id will be created
 */
export async function upsertUnitsClient(unitsData: Partial<UnitInsert>[]): Promise<Unit[]> {
    if (unitsData.length === 0) return [];

    const supabase = createClient();

    const { data, error } = await supabase
        .from("units")
        .upsert(unitsData, {
            onConflict: "id",
            ignoreDuplicates: false,
        })
        .select();

    if (error) {
        console.error("Error upserting units:", error);
        throw new Error(error.message);
    }

    return data ?? [];
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

export async function checkUnitLiked(unitId: string, userId: string): Promise<boolean> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("property_likes")
        .select("*")
        .eq("user_id", userId)
        .eq("unit_id", unitId)
        .maybeSingle();

    if (error) {
        console.error("Error checking unit like:", error);
        return false;
    }

    return !!data;
}

/**
 * Add a like for a unit
 */
export async function addUnitLike(unitId: string, userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("property_likes")
        .insert([{ user_id: userId, unit_id: unitId }]);

    if (error) {
        console.error("Error liking unit:", error);
        throw new Error(error.message);
    }
}

/**
 * Remove a like for a unit
 */
export async function removeUnitLike(unitId: string, userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("property_likes")
        .delete()
        .eq("user_id", userId)
        .eq("unit_id", unitId);

    if (error) {
        console.error("Error unliking unit:", error);
        throw new Error(error.message);
    }
}

/**
 * Toggle like for a unit - returns the new liked state
 * @param unitId - The unit ID to toggle like for
 * @param userId - The user ID
 * @param checked - The current liked state (avoids extra network call to check)
 */
export async function toggleUnitLike(
    unitId: string,
    userId: string | undefined,
    checked: boolean
): Promise<boolean> {
    if (!userId) {
        throw new Error("User must be authenticated to toggle like");
    }

    if (checked) {
        await removeUnitLike(unitId, userId);
        return false;
    } else {
        await addUnitLike(unitId, userId);
        return true;
    }
}

/**
 * Get the number of likes for a unit
 */
export async function getUnitLikesCount(unitId: string): Promise<number> {
    const supabase = createClient();

    const { count, error } = await supabase
        .from("property_likes")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", unitId);

    if (error) {
        console.error("Error fetching unit likes count:", error);
        return 0;
    }

    return count ?? 0;
}

/**
 * Get the number of likes for multiple units
 */
export async function getBulkUnitLikesCounts(unitIds: string[]): Promise<Record<string, number>> {
    if (unitIds.length === 0) return {};

    const supabase = createClient();

    const { data, error } = await supabase
        .from("property_likes")
        .select("unit_id")
        .in("unit_id", unitIds);

    if (error) {
        console.error("Error fetching bulk unit likes counts:", error);
        return {};
    }

    // Count likes per unit
    const counts: Record<string, number> = {};
    unitIds.forEach(id => counts[id] = 0);

    data?.forEach(like => {
        counts[like.unit_id] = (counts[like.unit_id] || 0) + 1;
    });

    return counts;
}

