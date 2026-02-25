import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a user has admin or super_admin role
 */
export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();

    if (error) {
        console.error("Error checking admin role:", error);
        return false;
    }

    return !!data;
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(
    supabase: SupabaseClient,
    userId: string,
    role: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", role)
        .maybeSingle();

    if (error) {
        console.error("Error checking user role:", error);
        return false;
    }

    return !!data;
}

