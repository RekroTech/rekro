import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/auth.types";

/**
 * User roles service for managing user roles
 */
export const userRolesService = {
    /**
     * Get all roles for a user
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
        const roles = await userRolesService.getUserRoles(userId);
        return roles.includes(role);
    },

    /**
     * Check if a user has any of the specified roles
     */
    hasAnyRole: async (userId: string, roles: AppRole[]): Promise<boolean> => {
        const userRoles = await userRolesService.getUserRoles(userId);
        return roles.some((role) => userRoles.includes(role));
    },

    /**
     * Check if a user has all of the specified roles
     */
    hasAllRoles: async (userId: string, roles: AppRole[]): Promise<boolean> => {
        const userRoles = await userRolesService.getUserRoles(userId);
        return roles.every((role) => userRoles.includes(role));
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
