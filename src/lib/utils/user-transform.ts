/**
 * User Transformation Utilities
 * Centralized logic for transforming Supabase user data to app User model
 */

import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { AppRole, User } from "@/types/auth.types";
import { userRolesService } from "@/services/user_roles.service";

/**
 * Transform Supabase auth user to app User model
 * Fetches roles from database
 */
export async function toAppUser(supabaseUser: SupabaseUser): Promise<User> {
    const email = supabaseUser.email ?? "";

    const nameFromMeta =
        typeof supabaseUser.user_metadata?.name === "string"
            ? supabaseUser.user_metadata.name
            : undefined;

    // Fetch user roles from database
    const roles = await userRolesService.getUserRoles(supabaseUser.id);

    return {
        id: supabaseUser.id,
        email,
        name: nameFromMeta ?? email.split("@")[0] ?? "User",
        image_url:
            typeof supabaseUser.user_metadata?.avatar_url === "string"
                ? supabaseUser.user_metadata.avatar_url
                : null,
        roles,
    };
}

/**
 * Transform Supabase auth user with profile data to complete app User model
 */
export async function toAppUserWithProfile(
    supabaseUser: SupabaseUser,
    profileData?: Record<string, unknown> | null
): Promise<User> {
    const email = supabaseUser.email ?? "";

    // Extract roles from the joined data or fetch them
    const roles = profileData?.user_roles
        ? ((profileData.user_roles as Array<{ role: string }> | undefined)?.map(
              (r) => r.role as AppRole
          ) ?? [])
        : await userRolesService.getUserRoles(supabaseUser.id);

    const nameFromMeta =
        typeof supabaseUser.user_metadata?.name === "string"
            ? supabaseUser.user_metadata.name
            : undefined;

    // Priority: public.users > user_metadata > auth.users > defaults
    return {
        id: supabaseUser.id,
        email,
        name:
            (profileData?.full_name as string | null | undefined) ??
            nameFromMeta ??
            email.split("@")[0] ??
            "User",
        full_name: (profileData?.full_name as string | null | undefined) ?? null,
        username: (profileData?.username as string | null | undefined) ?? null,
        phone:
            (profileData?.phone as string | null | undefined) ??
            supabaseUser?.phone ??
            null,
        image_url: (profileData?.image_url as string | null | undefined) ?? null,
        roles,
        current_location:
            (profileData?.current_location as Record<string, unknown> | null | undefined) ??
            null,
        destination_location:
            (profileData?.destination_location as Record<string, unknown> | null | undefined) ??
            null,
        study_field: (profileData?.study_field as string | null | undefined) ?? null,
        study_level: (profileData?.study_level as string | null | undefined) ?? null,
        university: (profileData?.university as string | null | undefined) ?? null,
        languages: (profileData?.languages as string[] | null | undefined) ?? null,
        max_budget_per_week:
            (profileData?.max_budget_per_week as number | null | undefined) ?? null,
        receive_marketing_email:
            (profileData?.receive_marketing_email as boolean | undefined) ?? false,
        date_of_birth: (profileData?.date_of_birth as string | null | undefined) ?? null,
        gender: (profileData?.gender as User["gender"] | null | undefined) ?? null,
        occupation: (profileData?.occupation as string | null | undefined) ?? null,
        bio: (profileData?.bio as string | null | undefined) ?? null,
        preferred_contact_method:
            (profileData?.preferred_contact_method as
                | User["preferred_contact_method"]
                | null
                | undefined) ?? undefined,
        notification_preferences:
            (profileData?.notification_preferences as
                | Record<string, unknown>
                | null
                | undefined) ?? null,
        last_login_at: (profileData?.last_login_at as string | null | undefined) ?? null,
        created_at: (profileData?.created_at as string | undefined) ?? undefined,
        updated_at: (profileData?.updated_at as string | undefined) ?? undefined,
    };
}

