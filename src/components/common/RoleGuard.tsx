"use client";

import { ReactNode } from "react";
import type { AppRole } from "@/types/auth.types";

interface User {
    id: string;
    email: string;
    roles?: AppRole[];
}

interface RoleGuardProps {
    user: User | null;
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

const ROLE_HIERARCHY: Record<AppRole, number> = {
    tenant: 1,
    landlord: 2,
    admin: 3,
    super_admin: 4,
};

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
    const userRoles = user?.roles || [];

    // Check specific role
    if (role && !userRoles.includes(role)) {
        return <>{fallback}</>;
    }

    // Check any of the roles
    if (anyRole && !anyRole.some((r) => userRoles.includes(r))) {
        return <>{fallback}</>;
    }

    // Check all roles
    if (allRoles && !allRoles.every((r) => userRoles.includes(r))) {
        return <>{fallback}</>;
    }

    // Check minimum role level
    if (minimumRole) {
        if (userRoles.length === 0) {
            return <>{fallback}</>;
        }
        const minimumLevel = ROLE_HIERARCHY[minimumRole];
        const userMaxLevel = Math.max(...userRoles.map((r) => ROLE_HIERARCHY[r] || 0));
        if (userMaxLevel < minimumLevel) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

interface PermissionGuardProps {
    user: User | null;
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
    const userRoles = user?.roles || [];

    if (userRoles.length === 0) {
        return <>{fallback}</>;
    }

    const userMaxLevel = Math.max(...userRoles.map((r) => ROLE_HIERARCHY[r] || 0));

    if (canManageProperties && userMaxLevel < ROLE_HIERARCHY.landlord) {
        return <>{fallback}</>;
    }

    if (canManageUsers && userMaxLevel < ROLE_HIERARCHY.admin) {
        return <>{fallback}</>;
    }

    if (canApproveApplications && userMaxLevel < ROLE_HIERARCHY.landlord) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
