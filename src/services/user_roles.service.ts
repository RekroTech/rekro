import { createClient } from "@/lib/supabase/server";
import { AppRole } from "@/types/db";

/**
 * User roles service for managing user roles
 */
export const userRolesService = {
    /**
     * Get a user's single role.
     *
     * Contract: each user has exactly one row in public.user_roles.
     * If none exists (or on error), we fall back to `tenant`.
     */
    getUserRole: async (userId: string, fallback: AppRole = "tenant"): Promise<AppRole> => {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error fetching user role:", error);
            return fallback;
        }

        return (data?.role as AppRole | undefined) ?? fallback;
    },

    /**
     * Get all roles for a user
     * (kept for back-compat/admin tooling; app auth assumes single role)
     */
    getUserRoles: async (userId: string): Promise<AppRole[]> => {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId);

        if (error) {
            console.error("Error fetching user roles:", error);
            return [];
        }

        return data?.map((r) => r.role as AppRole) ?? [];
    },

    /**
     * Add a role to a user
     */
    addUserRole: async (userId: string, role: AppRole): Promise<boolean> => {
        const supabase = await createClient();

        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });

        if (error) {
            console.error("Error adding user role:", error);
            return false;
        }

        return true;
    },

    /**
     * Remove a role from a user
     */
    removeUserRole: async (userId: string, role: AppRole): Promise<boolean> => {
        const supabase = await createClient();

        const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId)
            .eq("role", role);

        if (error) {
            console.error("Error removing user role:", error);
            return false;
        }

        return true;
    },

    /**
     * Check if a user has a specific role
     */
    hasRole: async (userId: string, role: AppRole): Promise<boolean> => {
        const userRole = await userRolesService.getUserRole(userId);
        return userRole === role;
    },

    /**
     * Check if a user has any of the specified roles
     */
    hasAnyRole: async (userId: string, roles: AppRole[]): Promise<boolean> => {
        const userRole = await userRolesService.getUserRole(userId);
        return roles.includes(userRole);
    },

    /**
     * Check if a user has all of the specified roles
     * (with single-role users this is only true when roles contains exactly the user's role)
     */
    hasAllRoles: async (userId: string, roles: AppRole[]): Promise<boolean> => {
        const userRole = await userRolesService.getUserRole(userId);
        return roles.length > 0 && roles.every((r) => r === userRole);
    },

    /**
     * Set user roles (replaces all existing roles)
     */
    setUserRoles: async (userId: string, roles: AppRole[]): Promise<boolean> => {
        const supabase = await createClient();

        // Delete existing roles
        const { error: deleteError } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId);

        if (deleteError) {
            console.error("Error deleting user roles:", deleteError);
            return false;
        }

        // Insert new roles
        if (roles.length > 0) {
            const { error: insertError } = await supabase
                .from("user_roles")
                .insert(roles.map((role) => ({ user_id: userId, role })));

            if (insertError) {
                console.error("Error inserting user roles:", insertError);
                return false;
            }
        }

        return true;
    },
};
