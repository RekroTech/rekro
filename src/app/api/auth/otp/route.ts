import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processEmail } from "@/lib/utils";
import { authErrorResponse, authSuccessResponse } from "@/app/api/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = typeof body.email === "string" ? body.email : "";
        const redirectTo = typeof body.redirectTo === "string" ? body.redirectTo : "/";

        // Validate and normalize email
        const { normalized, isValid, error } = processEmail(email);
        if (!isValid) {
            return authErrorResponse(error || "Invalid email address", 400);
        }

        const supabase = await createClient();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const callbackUrl = `${baseUrl}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`;

        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: normalized,
            options: {
                emailRedirectTo: callbackUrl,
                shouldCreateUser: true,
            },
        });

        if (otpError) {
            const isRateLimit = otpError.message?.includes("request this after") ||
                               otpError.message?.includes("rate limit");

            return authErrorResponse(
                isRateLimit ? "Too many requests. Please wait a moment and try again."
                           : otpError.message ?? "Failed to send magic link",
                isRateLimit ? 429 : 400
            );
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

