"use client";

import { redirect } from "next/navigation";
import React, { useEffect } from "react";
import { useSession } from "@/lib/react-query/hooks/auth/useAuth";
import { ProfileCompletionProvider } from "@/contexts";
import { Loader } from "@/components/common";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { hasSession, isLoading } = useSession();

    useEffect(() => {
        if (!isLoading && !hasSession) {
            // Redirect to home with auth modal trigger
            redirect("/?auth=open");
        }
    }, [hasSession, isLoading]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (!hasSession) {
        return null;
    }

    return (
        <ProfileCompletionProvider>
            {children}
        </ProfileCompletionProvider>
    );
}
