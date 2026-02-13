import { createClient } from "@/lib/supabase/server";
import { authErrorResponse, authSuccessResponse } from "@/app/api/utils";

// Disable caching for auth routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            return authErrorResponse(error.message, 500);
        }

        return authSuccessResponse({ success: true });
    } catch (err) {
        console.error("Logout error:", err);
        return authErrorResponse("Internal server error", 500);
    }
}
