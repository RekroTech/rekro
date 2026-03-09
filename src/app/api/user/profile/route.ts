import { NextRequest } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import type {
    Profile,
    ProfileUpdate,
    UserApplicationProfile,
    UserApplicationProfileInsert,
    UserApplicationProfileUpdate,
} from "@/types/db";
import { ApplicationProfileUpdateSchema, ProfileUpdateSchema } from "@/lib/validators";
import { toE164AndAuthDigits } from "@/lib/utils/phone";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const authUser = await requireAuthForApi();
        const supabase = await createClient();

        const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select(`*, user_application_profile (*)`)
            .eq("id", authUser.id)
            .single<Profile & { user_application_profile: UserApplicationProfile | null }>();

        if (profileError) {
            return errorResponse("Failed to fetch profile", 500);
        }

        return successResponse(profileData);
    } catch (error) {
        console.error("Profile fetch error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }

        return errorResponse("Internal server error", 500);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        // Get authenticated user with role (no extra DB query needed!)
        const authUser = await requireAuthForApi();

        const supabase = await createClient();

        const rawBody = (await req.json()) as Record<string, unknown>;

        // Validate the entire body with both schemas
        let usersUpdateData: ProfileUpdate = {};
        let applicationProfileUpdateData: UserApplicationProfileUpdate = {};

        try {
            // Validate profile fields
            const profileResult = ProfileUpdateSchema.safeParse(rawBody);
            if (profileResult.success) {
                usersUpdateData = profileResult.data as ProfileUpdate;
            }

            // Validate application profile fields
            const appProfileResult = ApplicationProfileUpdateSchema.safeParse(rawBody);
            if (appProfileResult.success) {
                applicationProfileUpdateData = appProfileResult.data as UserApplicationProfileUpdate;
            }

            // If both failed, throw an error
            if (!profileResult.success && !appProfileResult.success) {
                return errorResponse(
                    `Validation error: ${profileResult.error.message}`,
                    400
                );
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid request data";
            return errorResponse(`Validation error: ${message}`, 400);
        }

        if (Object.keys(usersUpdateData).length > 0) {
            // When the phone number is being updated, set phone_verified_at correctly:
            //   - If the new phone matches auth.users.phone, restore phone_verified_at
            //     from auth.phone_confirmed_at → shows as verified.
            //   - Otherwise clear it → new unverified number.
            if ("phone" in usersUpdateData) {
                const {
                    data: { user: authUserData },
                } = await supabase.auth.getUser();
                const authPhone = (authUserData as any)?.phone ?? null;
                const authPhoneConfirmedAt = (authUserData as any)?.phone_confirmed_at ?? null;

                // Normalise to E.164 for storage and get digits-only form for auth comparison.
                const { e164, authDigits } = toE164AndAuthDigits(usersUpdateData.phone!);
                usersUpdateData.phone = e164;

                if (authDigits === authPhone && authPhoneConfirmedAt) {
                    usersUpdateData.phone_verified_at = authPhoneConfirmedAt;
                } else {
                    usersUpdateData.phone_verified_at = null;
                }
            }

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
            .select(`*, user_application_profile (*)`)
            .eq("id", authUser.id)
            .single<Profile & { user_application_profile: UserApplicationProfile | null }>();

        if (fetchError) {
            console.error("Profile fetch error:", fetchError);
            return errorResponse("Failed to fetch updated profile", 500);
        }

        return successResponse(updatedProfile);
    } catch (error) {
        console.error("Profile update error:", error);

        // Handle authentication errors from requireAuthForApi
        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }

        return errorResponse("Internal server error", 500);
    }
}
