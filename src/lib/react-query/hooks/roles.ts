/**
 * React hooks for role-based access control
 * Simplified to use session user from auth hooks + authorization helpers
 */

import { useMemo } from "react";
import type { AppRole } from "@/types/db";
import { useSessionUser } from "./auth";
import {
    hasRole,
    hasAnyRole,
    hasRoleLevel,
    canManageProperties as canManagePropertiesHelper,
    canManageUsers as canManageUsersHelper,
    ROLE_HIERARCHY
} from "@/lib/utils/authorization";

export type RolesApi = {
    /** Current session user (auth identity + role). `null` when signed out. */
    user: ReturnType<typeof useSessionUser>["data"];

    /** Quick access to the current role (or null). */
    role: AppRole | null;

    /** Numeric level for the current role (0 when signed out). */
    roleLevel: number;

    /** Check if user has a specific role */
    hasRole: (role: AppRole) => boolean;

    /** Check if user has any of the specified roles */
    hasAnyRole: (roles: AppRole[]) => boolean;

    /** Check if user has role level or higher */
    hasRoleLevel: (minimumRole: AppRole) => boolean;

    /** Can manage properties (landlord+) */
    canManageProperties: boolean;

    /** Can manage users (admin+) */
    canManageUsers: boolean;
};

/**
 * Single hook exposing role helpers.
 * Session user is derived from auth; no need to pass user info around.
 */
export function useRoles(): RolesApi {
    const { data: user } = useSessionUser();

    return useMemo(
        () => ({
            user,
            role: user?.role ?? null,
            roleLevel: user ? (ROLE_HIERARCHY[user.role] ?? 0) : 0,
            hasRole: (role: AppRole) => hasRole(user ?? null, role),
            hasAnyRole: (roles: AppRole[]) => hasAnyRole(user ?? null, roles),
            hasRoleLevel: (minimumRole: AppRole) => hasRoleLevel(user ?? null, minimumRole),
            canManageProperties: canManagePropertiesHelper(user ?? null),
            canManageUsers: canManageUsersHelper(user ?? null),
        }),
        [user]
    );
}



