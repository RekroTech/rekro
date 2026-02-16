import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userRolesService } from "@/services/user_roles.service";
import { isNonEmptyString, isValidPassword } from "@/lib/utils/validation";
import { authErrorResponse, authSuccessResponse } from "@/app/api/utils";

// Disable caching for auth routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SignupBody = {
    email?: unknown;
    password?: unknown;
    name?: unknown;
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as SignupBody;

        const email = isNonEmptyString(body.email) ? body.email.trim() : "";
        const password = isNonEmptyString(body.password) ? body.password : "";
        const name = typeof body.name === "string" ? body.name.trim() : undefined;

        if (!email || !password) {
            return authErrorResponse("Email and password are required", 400);
        }

        if (!isValidPassword(password)) {
            return authErrorResponse("Password must be at least 6 characters", 400);
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
            return authErrorResponse(error?.message ?? "Signup failed", 400);
        }

        // Assign the default tenant role to the new user
        await userRolesService.addUserRole(data.user.id, "tenant");

        return authSuccessResponse({ user: data.user });
    } catch (err) {
        console.error("Signup error:", err);
        return authErrorResponse("Internal server error", 500);
    }
}
