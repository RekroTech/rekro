import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonEmptyString } from "@/lib/utils/validation";
import { processEmail } from "@/lib/utils/email";
import { authErrorResponse, authSuccessResponse } from "@/app/api/utils";

// Disable caching for auth routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ResendVerificationBody = {
    email?: unknown;
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ResendVerificationBody;

        const email = isNonEmptyString(body.email) ? body.email : "";

        // Validate and normalize email
        const { normalized, isValid, error: validationError } = processEmail(email);

        if (!isValid) {
            return authErrorResponse(validationError || "Invalid email address", 400);
        }

        const supabase = await createClient();

        // Note: The base callback URL must be configured in Supabase Dashboard
        // → Authentication → URL Configuration → Redirect URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const callbackUrl = `${baseUrl}/api/auth/callback?next=/`;

        // Resend magic link by calling signInWithOtp again
        const { error } = await supabase.auth.signInWithOtp({
            email: normalized,
            options: {
                emailRedirectTo: callbackUrl,
                shouldCreateUser: true,
            },
        });

        if (error) {
            // Handle rate limiting
            if (error.message?.includes("request this after") || error.message?.includes("rate limit")) {
                return authErrorResponse(
                    "Too many requests. Please wait a moment and try again.",
                    429
                );
            }

            return authErrorResponse(error.message ?? "Failed to resend verification email", 400);
        }

        return authSuccessResponse({
            message: "Verification email sent. Please check your inbox.",
        });
    } catch (err) {
        console.error("Resend verification error:", err);
        return authErrorResponse("Internal server error", 500);
    }
}

