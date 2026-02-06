import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userRolesService } from "@/services/user_roles.service";

// Disable caching for auth routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SignupBody = {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    role?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as SignupBody;

        const email = isNonEmptyString(body.email) ? body.email.trim() : "";
        const password = isNonEmptyString(body.password) ? body.password : "";
        const name = typeof body.name === "string" ? body.name.trim() : undefined;
        const role = body.role === "landlord" ? "landlord" : "tenant"; // Default to tenant

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        const supabase = await createClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name ?? email.split("@")[0],
                },
            },
        });

        if (error || !data.user) {
            return NextResponse.json(
                { error: error?.message ?? "Signup failed" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Assign the default role to the new user
        await userRolesService.addUserRole(data.user.id, role);

        // Fetch user roles
        const roles = await userRolesService.getUserRoles(data.user.id);

        // Normalize to your app User shape
        const user = {
            id: data.user.id,
            email: data.user.email ?? "",
            name:
                (typeof data.user.user_metadata?.name === "string"
                    ? data.user.user_metadata.name
                    : undefined) ??
                data.user.email?.split("@")[0] ??
                "User",
            avatar_url:
                typeof data.user.user_metadata?.avatar_url === "string"
                    ? data.user.user_metadata.avatar_url
                    : null,
            roles,
        };

        return NextResponse.json(
            { user },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}
