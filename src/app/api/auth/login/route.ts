import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonEmptyString } from "@/lib/utils/validation";
import { authErrorResponse, authSuccessResponse } from "@/app/api/utils";

// Disable caching for auth routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Auth operations require Node.js runtime

type LoginBody = {
    email?: unknown;
    password?: unknown;
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as LoginBody;

        const email = isNonEmptyString(body.email) ? body.email.trim() : "";
        const password = isNonEmptyString(body.password) ? body.password : "";

        if (!email || !password) {
            return authErrorResponse("Email and password are required", 400);
        }

        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.user) {
            return authErrorResponse(error?.message ?? "Invalid credentials", 401);
        }

        return authSuccessResponse({ user: data.user });
    } catch (err) {
        console.error("Login error:", err);
        return authErrorResponse("Internal server error", 500);
    }
}
