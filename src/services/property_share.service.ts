import { createClient } from "@/lib/supabase/client";
import { PropertyShareInsert } from "@/types/db";

export async function createPropertyShareClient(
    shareData: Omit<PropertyShareInsert, "id" | "created_at">
): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("property_shares").insert([shareData]);

    if (error) {
        throw new Error(error.message);
    }
}

export async function getPropertySharesByUnitClient(unitId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("property_shares")
        .select("*")
        .eq("unit_id", unitId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getPropertySharesCountClient(unitId: string): Promise<number> {
    const supabase = createClient();

    const { count, error } = await supabase
        .from("property_shares")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", unitId);

    if (error) {
        throw new Error(error.message);
    }

    return count ?? 0;
}
