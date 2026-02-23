import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonEmptyString } from "@/lib/utils/validation";
import { processEmail } from "@/lib/utils/email";
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

        const email = isNonEmptyString(body.email) ? body.email : "";
        const redirectTo = isNonEmptyString(body.redirectTo) ? body.redirectTo : "/";

        // Validate and normalize email
        const { normalized, isValid, error: validationError } = processEmail(email);

        if (!isValid) {
            return authErrorResponse(validationError || "Invalid email address", 400);
        }

        const supabase = await createClient();

        // Note: The base callback URL (e.g., http://localhost:3000/api/auth/callback)
        // must be configured in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
        // We append the 'next' parameter to specify where to redirect after authentication
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const callbackUrl = `${baseUrl}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`;

        // Send OTP email - works for both new and existing users
        const { error } = await supabase.auth.signInWithOtp({
            email: normalized,
            options: {
                emailRedirectTo: callbackUrl,
                shouldCreateUser: true,
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

