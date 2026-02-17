import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import type {
    Profile,
    ProfileUpdate,
    UserApplicationProfile,
    UserApplicationProfileInsert,
    UserApplicationProfileUpdate,
} from "@/types/db";

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

        const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select(
                `
                *,
                user_application_profile (
                    *
                )
            `
            )
            .eq("id", authUser.id)
            .single<Profile & { user_application_profile: UserApplicationProfile | null }>();

        if (profileError) {
            return errorResponse("Failed to fetch profile", 500);
        }

        return successResponse(profileData);
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

        const body = (await req.json()) as Record<string, unknown>;

        // Columns that exist on `public.users` table
        const usersTableFields: (keyof ProfileUpdate)[] = [
            "full_name",
            "username",
            "phone",
            "image_url",
            "current_location",
            "native_language",
            "receive_marketing_email",
            "date_of_birth",
            "gender",
            "occupation",
            "bio",
            "preferred_contact_method",
            "notification_preferences",
            "discoverable",
            "share_contact",
        ];

        // Columns that exist on `user_application_profile` table
        const applicationProfileFields: (keyof UserApplicationProfileUpdate)[] = [
            "visa_status",
            "employment_status",
            "employment_type",
            "income_source",
            "income_frequency",
            "income_amount",
            "student_status",
            "finance_support_type",
            "finance_support_details",
            "preferred_locality",
            "max_budget_per_week",
            "has_pets",
            "smoker",
            "emergency_contact_name",
            "emergency_contact_phone",
            "documents",
        ];

        const usersUpdateData: ProfileUpdate = {};
        for (const key of usersTableFields) {
            if (key in body) {
                (usersUpdateData as Record<string, unknown>)[key] = body[key as string];
            }
        }

        const applicationProfileUpdateData: UserApplicationProfileUpdate = {};
        for (const key of applicationProfileFields) {
            if (key in body) {
                (applicationProfileUpdateData as Record<string, unknown>)[key] = body[key as string];
            }
        }

        if (Object.keys(usersUpdateData).length > 0) {
            const { error: updateError } = await supabase
                .from("users")
                .update(usersUpdateData)
                .eq("id", authUser.id);

            if (updateError) {
                console.error("Users table update error:", updateError);
                return errorResponse("Failed to update profile", 500);
            }
        }

        if (Object.keys(applicationProfileUpdateData).length > 0) {
            const insertPayload: UserApplicationProfileInsert = {
                user_id: authUser.id,
                ...applicationProfileUpdateData,
            };

            const { error: appProfileError } = await supabase
                .from("user_application_profile")
                .upsert(insertPayload, { onConflict: "user_id" });

            if (appProfileError) {
                console.error("Application profile update error:", appProfileError);
                return errorResponse("Failed to update application profile", 500);
            }
        }

        const { data: updatedProfile, error: fetchError } = await supabase
            .from("users")
            .select(
                `
                *,
                user_application_profile (
                    *
                )
            `
            )
            .eq("id", authUser.id)
            .single<Profile & { user_application_profile: UserApplicationProfile | null }>();

        if (fetchError) {
            console.error("Profile fetch error:", fetchError);
            return errorResponse("Failed to fetch updated profile", 500);
        }

        return successResponse(updatedProfile);
    } catch (error) {
        console.error("Profile update error:", error);
        return errorResponse("Internal server error", 500);
    }
}
