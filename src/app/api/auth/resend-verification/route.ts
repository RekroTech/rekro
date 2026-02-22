import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNonEmptyString } from "@/lib/utils/validation";
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

        const email = isNonEmptyString(body.email) ? body.email.trim() : "";

        if (!email) {
            return authErrorResponse("Email is required", 400);
        }

        const supabase = await createClient();

        // Resend confirmation email
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback?type=signup&next=/dashboard`,
            }
        });

        if (error) {
            // Handle rate limiting
            if (error.message?.includes("request this after")) {
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

