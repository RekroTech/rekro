/**
 * Phone Verification – Verify OTP Route Handler
 *
 * POST /api/user/phone-verification/verify
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbErrorResponse, errorResponse, successResponse, precheck } from "@/app/api/utils";
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
        const check = await precheck(request, { auth: true });
        if (!check.ok) return check.error;
        const { user: authUser } = check;
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
            type: "phone_change",
        });

        if (verifyError) {
            return dbErrorResponse("phone-verification/verify otp", verifyError, "Invalid or expired OTP", 400);
        }

        // Stamp phone_verified_at and persist the verified phone number
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
            .from("users")
            .update({ phone_verified_at: now, phone })
            .eq("id", authUser.id);

        if (updateError) {
            console.error("Failed to update phone_verified_at:", {
                message: updateError.message,
                code: "code" in updateError ? updateError.code : undefined,
            });
            return errorResponse("Phone verified but failed to save status", 500);
        }

        return successResponse({ message: "Phone verified successfully", verified_at: now });
    } catch (error) {
        console.error("Phone verification verify error:", error);
        return errorResponse("Internal server error", 500);
    }
}
