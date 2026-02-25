"use client";

import { ReactNode } from "react";
import type { AppRole } from "@/types/db";
import type { SessionUser } from "@/types/auth.types";
import { ROLE_HIERARCHY } from "@/lib/utils/authorization";

interface RoleGuardProps {
    user: SessionUser | null;
    children: ReactNode;
    fallback?: ReactNode;
    /**
     * Required role(s)
     */
    role?: AppRole;
    /**
     * User must have any of these roles
     */
    anyRole?: AppRole[];
    /**
     * User must have all of these roles
     */
    allRoles?: AppRole[];
    /**
     * User must have this role level or higher
     */
    minimumRole?: AppRole;
}

/**
 * Component that conditionally renders children based on user roles
 *
 * @example
 * ```tsx
 * <RoleGuard user={user} role="landlord">
 *   <LandlordDashboard />
 * </RoleGuard>
 * ```
 *
 * @example
 * ```tsx
 * <RoleGuard user={user} anyRole={["landlord", "admin"]} fallback={<AccessDenied />}>
 *   <ManageProperties />
 * </RoleGuard>
 * ```
 *
 * @example
 * ```tsx
 * <RoleGuard user={user} minimumRole="landlord">
 *   <PropertyManagement />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
    user,
    children,
    fallback = null,
    role,
    anyRole,
    allRoles,
    minimumRole,
}: RoleGuardProps) {
    if (!user) {
        return <>{fallback}</>;
    }

    // Check specific role
    if (role && user.role !== role) {
        return <>{fallback}</>;
    }

    // Check any of the roles
    if (anyRole && !anyRole.includes(user.role)) {
        return <>{fallback}</>;
    }

    // Check all roles (with single role, only valid if allRoles contains exactly the user's role)
    if (allRoles && !(allRoles.length === 1 && allRoles[0] === user.role)) {
        return <>{fallback}</>;
    }

    // Check minimum role level
    if (minimumRole) {
        const minimumLevel = ROLE_HIERARCHY[minimumRole];
        const userLevel = ROLE_HIERARCHY[user.role] || 0;
        if (userLevel < minimumLevel) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

interface PermissionGuardProps {
    user: SessionUser | null;
    children: ReactNode;
    fallback?: ReactNode;
    /**
     * Check if user can manage properties
     */
    canManageProperties?: boolean;
    /**
     * Check if user can manage users
     */
    canManageUsers?: boolean;
    /**
     * Check if user can approve applications
     */
    canApproveApplications?: boolean;
}

/**
 * Component that conditionally renders based on user permissions
 *
 * @example
 * ```tsx
 * <PermissionGuard user={user} canManageProperties>
 *   <CreatePropertyButton />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
    user,
    children,
    fallback = null,
    canManageProperties,
    canManageUsers,
    canApproveApplications,
}: PermissionGuardProps) {
    if (!user) {
        return <>{fallback}</>;
    }

    const userLevel = ROLE_HIERARCHY[user.role] || 0;

    if (canManageProperties && userLevel < ROLE_HIERARCHY.landlord!) {
        return <>{fallback}</>;
    }

    if (canManageUsers && userLevel < ROLE_HIERARCHY.admin!) {
        return <>{fallback}</>;
    }

    if (canApproveApplications && userLevel < ROLE_HIERARCHY.landlord!) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
