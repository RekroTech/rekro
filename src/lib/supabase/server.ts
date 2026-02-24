import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types/auth.types";
import type { AppRole } from "@/types/db";

// ============================================================================
// Supabase Server Client
// ============================================================================

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

// ============================================================================
// Server-Side Auth Utilities
// ============================================================================

/**
 * Get the current session user with profile and role data.
 * Cached per-request to prevent multiple database calls.
 *
 * @returns SessionUser or null if not authenticated
 *
 * @example
 * // In a Server Component
 * const user = await getSession();
 * if (!user) return <LoginPrompt />;
 */
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
 * Require authentication in Server Components.
 * Redirects to home page with auth modal if not authenticated.
 *
 * @returns SessionUser (guaranteed to be authenticated)
 *
 * @example
 * // In a Server Component/Layout
 * const user = await requireAuth();
 * return <DashboardContent user={user} />;
 */
export const requireAuth = cache(async (): Promise<SessionUser> => {
    const user = await getSession();
    if (!user) redirect("/?auth=open");
    return user;
});

/**
 * Require authentication in API Routes.
 * Throws error instead of redirecting (for API error handling).
 *
 * @returns SessionUser (guaranteed to be authenticated)
 * @throws Error if not authenticated
 *
 * @example
 * // In an API route
 * export async function POST(request: NextRequest) {
 *     const user = await requireAuthForApi();
 *     // ... handle authenticated request
 * }
 */
export async function requireAuthForApi(): Promise<SessionUser> {
    const user = await getSession();
    if (!user) throw new Error("Unauthorized");
    return user;
}

