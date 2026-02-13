import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import { toAppUserWithProfile } from "@/lib/utils/user-transform";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return errorResponse("Unauthorized", 401);
        }

        // Fetch profile data with roles
        const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select(
                `
                *,
                user_roles (
                    role
                )
            `
            )
            .eq("id", authUser.id)
            .single();

        if (profileError) {
            return errorResponse("Failed to fetch profile", 500);
        }

        // Transform to complete app user model
        const user = await toAppUserWithProfile(authUser, profileData);

        return successResponse(user);
    } catch (error) {
        console.error("Profile fetch error:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return errorResponse("Unauthorized", 401);
        }

        const body = await req.json();

        // Columns that exist on `public.users` and are safe to update via the profile UI
        const allowedFields = [
            "full_name",
            "username",
            "phone",
            "image_url",
            "current_location",
            "destination_location",
            "study_field",
            "study_level",
            "university",
            "languages",
            "max_budget_per_week",
            "receive_marketing_email",
            "date_of_birth",
            "gender",
            "occupation",
            "bio",
            "preferred_contact_method",
            "notification_preferences",
        ];

        // Filter only allowed fields
        const updateData: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (key in body) {
                updateData[key] = body[key];
            }
        }

        // Update profile with roles included in response
        const { data: updatedProfile, error: updateError } = await supabase
            .from("users")
            .update(updateData)
            .eq("id", authUser.id)
            .select(
                `
                *,
                user_roles (
                    role
                )
            `
            )
            .single();

        if (updateError) {
            console.error("Profile update error:", updateError);
            return errorResponse("Failed to update profile", 500);
        }

        // Transform to complete app user model
        const user = await toAppUserWithProfile(authUser, updatedProfile);

        return successResponse(user);
    } catch (error) {
        console.error("Profile update error:", error);
        return errorResponse("Internal server error", 500);
    }
}
