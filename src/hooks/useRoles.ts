/**
 * React hooks for role-based access control
 */

import { useCallback, useMemo } from "react";
import type { AppRole } from "@/types/db";
import { useSessionUser } from "@/lib/react-query/hooks/auth";

/**
 * Role hierarchy levels (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<AppRole, number> = {
    tenant: 1,
    landlord: 2,
    admin: 3,
    super_admin: 4,
};

export type RolesApi = {
    /** Current session user (auth identity + role). `null` when signed out. */
    user: ReturnType<typeof useSessionUser>["data"];

    /** Quick access to the current role (or null). */
    role: AppRole | null;

    /** Numeric level for the current role (0 when signed out). */
    roleLevel: number;

    hasRole: (role: AppRole) => boolean;
    hasAnyRole: (roles: AppRole[]) => boolean;

    canManageProperties: boolean;
    canManageUsers: boolean;
};

/**
 * Single hook exposing role helpers.
 *
 * Session user is derived from the session; no need to pass user info around.
 */
export function useRoles(): RolesApi {
    const { data: user } = useSessionUser();

    const role = user?.role ?? null;
    const roleLevel = role ? ROLE_HIERARCHY[role] ?? 0 : 0;

    const hasRole = useCallback(
        (target: AppRole) => {
            return role === target;
        },
        [role]
    );

    const hasAnyRole = useCallback(
        (roles: AppRole[]) => {
            return role ? roles.includes(role) : false;
        },
        [role]
    );

    const canManageProperties = roleLevel >= ROLE_HIERARCHY.landlord;
    const canManageUsers = roleLevel >= ROLE_HIERARCHY.admin;

    return useMemo(
        () => ({
            user,
            role,
            roleLevel,
            hasRole,
            hasAnyRole,
            canManageProperties,
            canManageUsers,
        }),
        [user, role, roleLevel, hasRole, hasAnyRole, canManageProperties, canManageUsers]
    );
}
