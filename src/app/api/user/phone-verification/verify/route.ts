/**
 * Phone Verification – Verify OTP Route Handler
 *
 * POST /api/user/phone-verification/verify
 */

import { NextRequest } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import { PhoneVerifyOtpSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/phone-verification/verify
 *
 * Verifies the OTP token against the phone number via Supabase Auth,
 * then stamps `phone_verified_at` on the authenticated user's row.
 * Requires the user to be authenticated.
 *
 * @param request - Contains: phone, token (6-digit OTP)
 * @returns 200 with verified_at timestamp on success, error response on failure
 */
export async function POST(request: NextRequest) {
    try {
        const authUser = await requireAuthForApi();
        const supabase = await createClient();

        // Parse and validate request body
        const rawBody = await request.json();

        let body;
        try {
            body = PhoneVerifyOtpSchema.parse(rawBody);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid request data";
            return errorResponse(`Validation error: ${message}`, 400);
        }

        const { phone, token } = body;

        // Verify the OTP via Supabase Auth
        const { error: verifyError } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: "sms",
        });

        if (verifyError) {
            console.error("Phone OTP verify error:", verifyError.message);
            return errorResponse(verifyError.message ?? "Invalid or expired OTP", 400);
        }

        // Stamp phone_verified_at and persist the verified phone number
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
            .from("users")
            .update({ phone_verified_at: now, phone })
            .eq("id", authUser.id);

        if (updateError) {
            console.error("Failed to update phone_verified_at:", updateError.message);
            return errorResponse("Phone verified but failed to save status", 500);
        }

        return successResponse({ message: "Phone verified successfully", verified_at: now });
    } catch (error) {
        console.error("Phone verification verify error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }
        return errorResponse("Internal server error", 500);
    }
}
