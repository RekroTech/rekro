/**
 * Phone Verification – Send OTP Route Handler
 *
 * POST /api/user/phone-verification/send
 */

import { NextRequest } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import { PhoneSendOtpSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/phone-verification/send
 *
 * Sends a 6-digit OTP SMS to the provided phone number via Supabase Auth.
 * Requires the user to be authenticated.
 *
 * @param request - Contains: phone (E.164 format recommended, e.g. +61412345678)
 * @returns 200 with success message on success, error response on failure
 */
export async function POST(request: NextRequest) {
    try {
        await requireAuthForApi();
        const supabase = await createClient();

        // Parse and validate request body
        const rawBody = await request.json();

        let body;
        try {
            body = PhoneSendOtpSchema.parse(rawBody);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid request data";
            return errorResponse(`Validation error: ${message}`, 400);
        }

        const { phone } = body;

        // Supabase signInWithOtp for phone sends an SMS OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({
            phone,
            options: {
                // We only want to send the OTP – do not create a new auth user
                shouldCreateUser: false,
            },
        });

        if (otpError) {
            const isRateLimit =
                otpError.message?.includes("request this after") ||
                otpError.message?.includes("rate limit");

            console.error("Phone OTP send error:", otpError.message);
            return errorResponse(
                isRateLimit
                    ? "Too many requests. Please wait a moment and try again."
                    : otpError.message ?? "Failed to send OTP",
                isRateLimit ? 429 : 400
            );
        }

        return successResponse({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Phone verification send error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        return errorResponse("Internal server error", 500);
    }
}
