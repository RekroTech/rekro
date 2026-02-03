import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";

// Force dynamic rendering for auth checks
export const dynamic = "force-dynamic";

export default async function UnauthenticatedLayout({ children }: { children: React.ReactNode }) {
    let user = null;

    try {
        user = await getSession();
    } catch (error) {
        console.error("Unauthenticated layout error:", error);
        // allow access
    }

    if (user) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
