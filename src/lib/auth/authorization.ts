/**
 * Role-based authorization utilities
 * Use these helpers to check user permissions throughout the app
 */

import type { AppRole } from "@/types/db";
import type { SessionUser } from "@/types/auth.types";

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
export function hasRole(user: SessionUser | null, role: AppRole): boolean {
    if (!user) return false;
    return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: SessionUser | null, roles: AppRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: SessionUser | null, roles: AppRole[]): boolean {
    if (!user) return false;
    return roles.length === 1 && roles[0] === user.role;
}

/**
 * Check if user has a role at or above the specified level
 */
export function hasRoleLevel(user: SessionUser | null, minimumRole: AppRole): boolean {
    if (!user) return false;

    const minimumLevel = ROLE_HIERARCHY[minimumRole];
    const userLevel = ROLE_HIERARCHY[user.role] || 0;

    return userLevel >= minimumLevel;
}

/**
 * Check if user is a tenant
 */
export function isTenant(user: SessionUser | null): boolean {
    return hasRole(user, "tenant");
}

/**
 * Check if user is a landlord
 */
export function isLandlord(user: SessionUser | null): boolean {
    return hasRole(user, "landlord");
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: SessionUser | null): boolean {
    return hasRole(user, "admin");
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: SessionUser | null): boolean {
    return hasRole(user, "super_admin");
}

/**
 * Check if user is a landlord or higher (landlord, admin, super_admin)
 */
export function isLandlordOrHigher(user: SessionUser | null): boolean {
    return hasRoleLevel(user, "landlord");
}

/**
 * Check if user is an admin or higher (admin, super_admin)
 */
export function isAdminOrHigher(user: SessionUser | null): boolean {
    return hasRoleLevel(user, "admin");
}

/**
 * Get the highest role level for a user
 */
export function getHighestRole(user: SessionUser | null): AppRole | null {
    if (!user) return null;
    return user.role;
}

/**
 * Check if user can manage properties (landlord, admin, super_admin)
 */
export function canManageProperties(user: SessionUser | null): boolean {
    return isLandlordOrHigher(user);
}

/**
 * Check if user can manage users (admin, super_admin)
 */
export function canManageUsers(user: SessionUser | null): boolean {
    return isAdminOrHigher(user);
}

/**
 * Check if user can approve applications (landlord, admin, super_admin)
 */
export function canApproveApplications(user: SessionUser | null): boolean {
    return isLandlordOrHigher(user);
}

/**
 * Require specific role or throw error
 * Use in API routes or server actions
 */
export function requireRole(user: SessionUser | null, role: AppRole): void {
    if (!hasRole(user, role)) {
        throw new Error(`Unauthorized: ${role} role required`);
    }
}

/**
 * Require any of the specified roles or throw error
 * Use in API routes or server actions
 */
export function requireAnyRole(user: SessionUser | null, roles: AppRole[]): void {
    if (!hasAnyRole(user, roles)) {
        throw new Error(`Unauthorized: one of [${roles.join(", ")}] roles required`);
    }
}

/**
 * Require role level or throw error
 * Use in API routes or server actions
 */
export function requireRoleLevel(user: SessionUser | null, minimumRole: AppRole): void {
    if (!hasRoleLevel(user, minimumRole)) {
        throw new Error(`Unauthorized: ${minimumRole} role or higher required`);
    }
}
