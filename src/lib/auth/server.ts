import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { redirect } from "next/navigation";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { AppRole } from "@/types/auth.types";
import { userRolesService } from "@/services/user_roles.service";

export interface User {
    id: string;
    email: string;
    name: string;
    roles?: AppRole[];
}

async function toAppUser(user: SupabaseUser): Promise<User> {
    const email = user.email ?? "";

    const nameFromMeta =
        typeof user.user_metadata?.name === "string" ? user.user_metadata.name : undefined;

    // Fetch user roles from database
    const roles = await userRolesService.getUserRoles(user.id);

    return {
        id: user.id,
        email,
        name: nameFromMeta ?? email.split("@")[0] ?? "User",
        roles,
    };
}

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
