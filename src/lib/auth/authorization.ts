/**
 * Role-based authorization utilities
 * Use these helpers to check user permissions throughout the app
 */

import type { AppRole } from "@/types/auth.types";
import type { User } from "@/lib/auth/server";

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
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: AppRole): boolean {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: AppRole[]): boolean {
    if (!user || !user.roles) return false;
    return roles.some((role) => user.roles!.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: User | null, roles: AppRole[]): boolean {
    if (!user || !user.roles) return false;
    return roles.every((role) => user.roles!.includes(role));
}

/**
 * Check if user has a role at or above the specified level
 */
export function hasRoleLevel(user: User | null, minimumRole: AppRole): boolean {
    if (!user || !user.roles || user.roles.length === 0) return false;

    const minimumLevel = ROLE_HIERARCHY[minimumRole];
    const userMaxLevel = Math.max(...user.roles.map((role: AppRole) => ROLE_HIERARCHY[role] || 0));

    return userMaxLevel >= minimumLevel;
}

/**
 * Check if user is a tenant
 */
export function isTenant(user: User | null): boolean {
    return hasRole(user, "tenant");
}

/**
 * Check if user is a landlord
 */
export function isLandlord(user: User | null): boolean {
    return hasRole(user, "landlord");
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
    return hasRole(user, "admin");
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: User | null): boolean {
    return hasRole(user, "super_admin");
}

/**
 * Check if user is a landlord or higher (landlord, admin, super_admin)
 */
export function isLandlordOrHigher(user: User | null): boolean {
    return hasRoleLevel(user, "landlord");
}

/**
 * Check if user is an admin or higher (admin, super_admin)
 */
export function isAdminOrHigher(user: User | null): boolean {
    return hasRoleLevel(user, "admin");
}

/**
 * Get the highest role level for a user
 */
export function getHighestRole(user: User | null): AppRole | null {
    if (!user || !user.roles || user.roles.length === 0) return null;

    return user.roles.reduce((highest: AppRole, role: AppRole) => {
        return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[highest] ? role : highest;
    }, user.roles[0]!);
}

/**
 * Check if user can manage properties (landlord, admin, super_admin)
 */
export function canManageProperties(user: User | null): boolean {
    return isLandlordOrHigher(user);
}

/**
 * Check if user can manage users (admin, super_admin)
 */
export function canManageUsers(user: User | null): boolean {
    return isAdminOrHigher(user);
}

/**
 * Check if user can approve applications (landlord, admin, super_admin)
 */
export function canApproveApplications(user: User | null): boolean {
    return isLandlordOrHigher(user);
}

/**
 * Require specific role or throw error
 * Use in API routes or server actions
 */
export function requireRole(user: User | null, role: AppRole): void {
    if (!hasRole(user, role)) {
        throw new Error(`Unauthorized: ${role} role required`);
    }
}

/**
 * Require any of the specified roles or throw error
 * Use in API routes or server actions
 */
export function requireAnyRole(user: User | null, roles: AppRole[]): void {
    if (!hasAnyRole(user, roles)) {
        throw new Error(`Unauthorized: one of [${roles.join(", ")}] roles required`);
    }
}

/**
 * Require role level or throw error
 * Use in API routes or server actions
 */
export function requireRoleLevel(user: User | null, minimumRole: AppRole): void {
    if (!hasRoleLevel(user, minimumRole)) {
        throw new Error(`Unauthorized: ${minimumRole} role or higher required`);
    }
}
