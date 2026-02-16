import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { SessionUser } from "@/types/auth.types";

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

    return data.user as SessionUser;
});

/**
 * Use this in Server Components / layouts when you want to enforce auth.
 * Redirects instead of throwing, so you don't rely on error boundaries.
 */
export const requireAuth = cache(async (): Promise<SessionUser> => {
    const user = await getSession();
    if (!user) redirect("/login");
    return user;
});

export async function requireAuthForApi(): Promise<SessionUser> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    return user;
}
