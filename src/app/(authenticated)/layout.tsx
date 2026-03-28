import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

/**
 * Authenticated Layout (Server Component)
 *
 * Guards all routes under /app/(authenticated) to require authentication.
 * Redirects unauthenticated users to home page with auth modal open.
 */
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    // Server-side auth check
    const user = await getSession();

    // Redirect to home if not authenticated
    if (!user) {
        redirect("/?auth=open");
    }

    return children;
}
