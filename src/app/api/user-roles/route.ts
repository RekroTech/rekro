import { NextRequest, NextResponse } from "next/server";
import { requireAuthForApi } from "@/lib/supabase/server";
import { userRolesService } from "@/services/user_roles.service";
import { requireRoleLevel } from "@/lib/auth/authorization";

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
