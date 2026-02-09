import { createClient } from "@/lib/supabase/client";
import { UnitAvailability, UnitAvailabilityInsert } from "@/types/db";

export async function createUnitAvailabilityClient(
    availabilityData: Omit<UnitAvailabilityInsert, "id" | "created_at">
): Promise<UnitAvailability> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("unit_availability")
        .insert([availabilityData])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function updateUnitAvailabilityClient(
    id: string,
    availabilityData: Partial<Omit<UnitAvailabilityInsert, "id" | "created_at" | "unit_id">>
): Promise<UnitAvailability> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("unit_availability")
        .update(availabilityData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getUnitAvailabilityByUnitIdClient(
    unitId: string
): Promise<UnitAvailability | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("unit_availability")
        .select("*")
        .eq("unit_id", unitId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // No availability found
            return null;
        }
        throw new Error(error.message);
    }

    return data;
}

export async function getUnitAvailabilitiesByUnitIdsClient(
    unitIds: string[]
): Promise<UnitAvailability[]> {
    if (unitIds.length === 0) return [];

    const supabase = createClient();

    const { data, error } = await supabase
        .from("unit_availability")
        .select("*")
        .in("unit_id", unitIds);

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

export async function deleteUnitAvailabilityByUnitIdClient(unitId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from("unit_availability").delete().eq("unit_id", unitId);

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Batch upsert unit availabilities (create new + update existing in one call)
 * Availabilities with id will be updated, availabilities without id will be created
 */
export async function upsertUnitAvailabilitiesClient(
    availabilitiesData: Partial<UnitAvailabilityInsert>[]
): Promise<UnitAvailability[]> {
    if (availabilitiesData.length === 0) return [];

    const supabase = createClient();

    const { data, error } = await supabase
        .from("unit_availability")
        .upsert(availabilitiesData, {
            onConflict: "unit_id", // Assuming one availability per unit
            ignoreDuplicates: false,
        })
        .select();

    if (error) {
        console.error("Error upserting unit availabilities:", error);
        throw new Error(error.message);
    }

    return data ?? [];
}
