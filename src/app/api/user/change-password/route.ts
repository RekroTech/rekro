import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return errorResponse("Unauthorized", 401);
        }

        const body = (await req.json()) as {
            currentPassword?: string;
            newPassword?: string;
        };

        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return errorResponse("Current password and new password are required", 400);
        }

        if (newPassword.length < 8) {
            return errorResponse("New password must be at least 8 characters long", 400);
        }

        // Verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: authUser.email!,
            password: currentPassword,
        });

        if (signInError) {
            return errorResponse("Current password is incorrect", 401);
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            console.error("Password update error:", updateError);
            return errorResponse("Failed to update password", 500);
        }

        return successResponse({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return errorResponse("Internal server error", 500);
    }
}

