import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonEmptyString, isValidPassword } from "@/lib/utils/validation";
import { authErrorResponse, authSuccessResponse } from "@/app/api/utils";
import { getSession } from "@/lib/auth/server";

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
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/callback?type=signup&next=/dashboard`,
            },
        });

        if (error) {
            // Handle rate limiting errors specifically
            if (error.message?.includes("request this after")) {
                return authErrorResponse(
                    "Too many signup attempts. Please wait a moment and try again.",
                    429
                );
            }

            // Handle other common errors
            if (error.message?.includes("already registered")) {
                return authErrorResponse(
                    "This email is already registered. Please log in instead.",
                    400
                );
            }

            return authErrorResponse(error.message ?? "Signup failed", 400);
        }

        if (!data.user) {
            return authErrorResponse("Signup failed", 400);
        }

        // Check if email confirmation is required
        // If session is null, email confirmation is enabled
        const requiresEmailConfirmation = !data.session;

        if (requiresEmailConfirmation) {
            // User created but needs to verify email
            return authSuccessResponse({
                user: null,
                requiresEmailConfirmation: true,
                message: "Please check your email to verify your account.",
            });
        }

        // Role assignment is handled by database trigger
        // Fetch complete session user (includes role and profile data)
        const user = await getSession();

        if (!user) {
            return authErrorResponse("Failed to fetch user session", 500);
        }

        return authSuccessResponse({ user });
    } catch (err) {
        console.error("Signup error:", err);
        return authErrorResponse("Internal server error", 500);
    }
}
