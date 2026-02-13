import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { User } from "@/types/auth.types";
import { toAppUser } from "@/lib/utils/user-transform";

// Cached per-request (prevents multiple getUser() calls in the same render/request)
export const getSession = cache(async (): Promise<User | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    // Logged-out state is normal; do not log as an error
    if (error?.message === "Auth session missing!") {
        return null;
    }

    // Unexpected errors: log (or send to Sentry) and treat as unauth
    if (error) {
        console.error("getSession error:", error.message);
        return null;
    }

    if (!data.user) return null;

    return await toAppUser(data.user);
});

/**
 * Use this in Server Components / layouts when you want to enforce auth.
 * Redirects instead of throwing, so you don't rely on error boundaries.
 */
export const requireAuth = cache(async (): Promise<User> => {
    const user = await getSession();
    if (!user) redirect("/login");
    return user;
});

export async function requireAuthForApi(): Promise<User> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    return user;
}
