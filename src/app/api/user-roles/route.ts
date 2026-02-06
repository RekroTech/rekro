import { NextRequest, NextResponse } from "next/server";
import { requireAuthForApi } from "@/lib/auth/server";
import { userRolesService } from "@/services/user_roles.service";
import { requireRoleLevel } from "@/lib/auth/authorization";
import type { AppRole } from "@/types/auth.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/user-roles
 * Get user's roles (own roles or any user if admin)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuthForApi();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        // If requesting another user's roles, require admin permission
        if (userId && userId !== user.id) {
            requireRoleLevel(user, "admin");
        }

        const roles = await userRolesService.getUserRoles(userId || user.id);

        return NextResponse.json({ roles }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch roles";

        if (message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ error: message }, { status: 403 });
    }
}

/**
 * POST /api/user-roles
 * Add a role to a user (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuthForApi();
        requireRoleLevel(user, "admin");

        const body = await request.json();
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
        }

        const validRoles: AppRole[] = ["tenant", "landlord", "admin", "super_admin"];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const success = await userRolesService.addUserRole(userId, role);

        if (!success) {
            return NextResponse.json({ error: "Failed to add role" }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add role";

        if (message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ error: message }, { status: 403 });
    }
}

/**
 * DELETE /api/user-roles
 * Remove a role from a user (admin only)
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuthForApi();
        requireRoleLevel(user, "admin");

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const role = searchParams.get("role");

        if (!userId || !role) {
            return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
        }

        const validRoles: AppRole[] = ["tenant", "landlord", "admin", "super_admin"];
        if (!validRoles.includes(role as AppRole)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const success = await userRolesService.removeUserRole(userId, role as AppRole);

        if (!success) {
            return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to remove role";

        if (message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ error: message }, { status: 403 });
    }
}

/**
 * PUT /api/user-roles
 * Set user roles (replaces all roles) (admin only)
 */
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuthForApi();
        requireRoleLevel(user, "admin");

        const body = await request.json();
        const { userId, roles } = body;

        if (!userId || !Array.isArray(roles)) {
            return NextResponse.json(
                { error: "userId and roles array are required" },
                { status: 400 }
            );
        }

        const validRoles: AppRole[] = ["tenant", "landlord", "admin", "super_admin"];
        const allValid = roles.every((role: string) => validRoles.includes(role as AppRole));

        if (!allValid) {
            return NextResponse.json({ error: "Invalid role(s)" }, { status: 400 });
        }

        const success = await userRolesService.setUserRoles(userId, roles);

        if (!success) {
            return NextResponse.json({ error: "Failed to set roles" }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to set roles";

        if (message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ error: message }, { status: 403 });
    }
}
