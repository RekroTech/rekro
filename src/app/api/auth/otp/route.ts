import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonEmptyString } from "@/lib/utils/validation";
import { authErrorResponse, authSuccessResponse } from "@/app/api/utils";

// Disable caching for auth routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OtpBody = {
    email?: unknown;
    redirectTo?: unknown;
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as OtpBody;

        const email = isNonEmptyString(body.email) ? body.email.trim().toLowerCase() : "";
        const redirectTo = isNonEmptyString(body.redirectTo) ? body.redirectTo : "/dashboard";

        if (!email) {
            return authErrorResponse("Email is required", 400);
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return authErrorResponse("Please enter a valid email address", 400);
        }

        const supabase = await createClient();

        // Construct the callback URL with redirect parameter
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`;

        // Send OTP email - works for both new and existing users
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: callbackUrl,
                shouldCreateUser: true, // Allow creating new users
            },
        });

        if (error) {
            // Handle rate limiting errors
            if (error.message?.includes("request this after") || error.message?.includes("rate limit")) {
                return authErrorResponse(
                    "Too many requests. Please wait a moment and try again.",
                    429
                );
            }

            // Handle other errors
            return authErrorResponse(error.message ?? "Failed to send magic link", 400);
        }

        return authSuccessResponse({
            message: "Magic link sent! Check your email to continue.",
            requiresEmailConfirmation: true,
        });
    } catch (err) {
        console.error("OTP auth error:", err);
        return authErrorResponse("Internal server error", 500);
    }
}

