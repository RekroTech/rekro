"use client";

import { redirect } from "next/navigation";
import React, { useEffect } from "react";
import { useSessionUser } from "@/lib/react-query/hooks/auth";

export default function UnauthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading } = useSessionUser();

    useEffect(() => {
        if (!isLoading && user) {
            // Redirect authenticated users to dashboard
            redirect("/dashboard");
        }
    }, [user, isLoading]);

    // Don't block rendering while checking auth
    // Unauthenticated pages should be accessible immediately
    return <>{children}</>;
}
