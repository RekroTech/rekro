"use client";

import { redirect } from "next/navigation";
import React, { useEffect } from "react";
import { useSessionUser } from "@/lib/react-query/hooks/auth";
import { ProfileCompletionProvider } from "@/contexts";
import { Loader } from "@/components/common";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading } = useSessionUser();

    useEffect(() => {
        if (!isLoading && !user) {
            // Redirect to home with auth modal trigger
            redirect("/?auth=open");
        }
    }, [user, isLoading]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <ProfileCompletionProvider>
            {children}
        </ProfileCompletionProvider>
    );
}
