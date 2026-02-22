import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { SessionUser } from "@/types/auth.types";
import type { AppRole } from "@/types/db";

// Cached per-request (prevents multiple getUser() calls in the same render/request)
export const getSession = cache(async (): Promise<SessionUser | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error?.message === "Auth session missing!") {
        return null;
    }

    if (error) {
        console.error("getSession error:", error.message);
        return null;
    }

    if (!data.user || !data.user.email) return null;

    // Fetch user profile and role from public tables
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
            `
            id,
            email,
            full_name,
            image_url,
            username,
            phone,
            user_roles!inner(role)
        `
        )
        .eq("id", data.user.id)
        .single();

    if (userError || !userData) {
        console.error("Failed to fetch user data:", userError?.message);
        return null;
    }

    // Extract role from the joined user_roles table
    const roleData = userData.user_roles as unknown as { role: AppRole } | { role: AppRole }[];
    const role = Array.isArray(roleData) ? roleData[0]?.role : roleData?.role;

    if (!role) {
        console.error("User has no role assigned");
        return null;
    }

    return {
        id: userData.id,
        email: userData.email ?? data.user.email,
        name: userData.full_name,
        image_url: userData.image_url,
        username: userData.username,
        phone: userData.phone,
        role,
    };
});

/**
 * Use this in Server Components / layouts when you want to enforce auth.
 * Redirects instead of throwing, so you don't rely on error boundaries.
 */
export const requireAuth = cache(async (): Promise<SessionUser> => {
    const user = await getSession();
    if (!user) redirect("/?auth=open");
    return user;
});

export async function requireAuthForApi(): Promise<SessionUser> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    return user;
}
