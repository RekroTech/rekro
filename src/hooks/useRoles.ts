/**
 * React hooks for role-based access control
 */

import { useMemo } from "react";
import type { AppRole } from "@/types/auth.types";

interface User {
    id: string;
    email: string;
    name?: string | null;
    roles?: AppRole[];
}

/**
 * Role hierarchy levels (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<AppRole, number> = {
    tenant: 1,
    landlord: 2,
    admin: 3,
    super_admin: 4,
};

/**
 * Hook for role-based checks
 */
export function useRoles(user: User | null) {
    return useMemo(() => {
        const roles = user?.roles || [];

        return {
            roles,
            hasRole: (role: AppRole) => roles.includes(role),
            hasAnyRole: (rolesToCheck: AppRole[]) =>
                rolesToCheck.some((role) => roles.includes(role)),
            hasAllRoles: (rolesToCheck: AppRole[]) =>
                rolesToCheck.every((role) => roles.includes(role)),
            hasRoleLevel: (minimumRole: AppRole) => {
                if (roles.length === 0) return false;
                const minimumLevel = ROLE_HIERARCHY[minimumRole];
                const userMaxLevel = Math.max(...roles.map((role) => ROLE_HIERARCHY[role] || 0));
                return userMaxLevel >= minimumLevel;
            },
            isTenant: roles.includes("tenant"),
            isLandlord: roles.includes("landlord"),
            isAdmin: roles.includes("admin"),
            isSuperAdmin: roles.includes("super_admin"),
            isLandlordOrHigher: (() => {
                if (roles.length === 0) return false;
                const userMaxLevel = Math.max(...roles.map((role) => ROLE_HIERARCHY[role] || 0));
                return userMaxLevel >= ROLE_HIERARCHY.landlord;
            })(),
            isAdminOrHigher: (() => {
                if (roles.length === 0) return false;
                const userMaxLevel = Math.max(...roles.map((role) => ROLE_HIERARCHY[role] || 0));
                return userMaxLevel >= ROLE_HIERARCHY.admin;
            })(),
            canManageProperties: (() => {
                if (roles.length === 0) return false;
                const userMaxLevel = Math.max(...roles.map((role) => ROLE_HIERARCHY[role] || 0));
                return userMaxLevel >= ROLE_HIERARCHY.landlord;
            })(),
            canManageUsers: (() => {
                if (roles.length === 0) return false;
                const userMaxLevel = Math.max(...roles.map((role) => ROLE_HIERARCHY[role] || 0));
                return userMaxLevel >= ROLE_HIERARCHY.admin;
            })(),
            canApproveApplications: (() => {
                if (roles.length === 0) return false;
                const userMaxLevel = Math.max(...roles.map((role) => ROLE_HIERARCHY[role] || 0));
                return userMaxLevel >= ROLE_HIERARCHY.landlord;
            })(),
            highestRole:
                roles.length === 0
                    ? null
                    : roles.reduce((highest, role) =>
                          ROLE_HIERARCHY[role] > ROLE_HIERARCHY[highest] ? role : highest
                      ),
        };
    }, [user]);
}

/**
 * Hook for checking if user has permission
 */
export function useHasRole(user: User | null, role: AppRole): boolean {
    return useMemo(() => {
        return user?.roles?.includes(role) ?? false;
    }, [user, role]);
}

/**
 * Hook for checking if user has any of the specified roles
 */
export function useHasAnyRole(user: User | null, roles: AppRole[]): boolean {
    return useMemo(() => {
        return roles.some((role) => user?.roles?.includes(role)) ?? false;
    }, [user, roles]);
}

/**
 * Hook for checking if user is landlord or higher
 */
export function useCanManageProperties(user: User | null): boolean {
    return useMemo(() => {
        if (!user?.roles || user.roles.length === 0) return false;
        const userMaxLevel = Math.max(...user.roles.map((role) => ROLE_HIERARCHY[role] || 0));
        return userMaxLevel >= ROLE_HIERARCHY.landlord;
    }, [user]);
}

/**
 * Hook for checking if user is admin or higher
 */
export function useCanManageUsers(user: User | null): boolean {
    return useMemo(() => {
        if (!user?.roles || user.roles.length === 0) return false;
        const userMaxLevel = Math.max(...user.roles.map((role) => ROLE_HIERARCHY[role] || 0));
        return userMaxLevel >= ROLE_HIERARCHY.admin;
    }, [user]);
}
