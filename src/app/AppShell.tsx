"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PropertyForm } from "@/components/PropertyForm";
import { useRoles } from "@/lib/hooks/roles";
import { AuthModal } from "@/components/Auth";
import { useAuthModal } from "@/contexts";
import { useAuthStateSync, useSessionUser } from "@/lib/hooks/auth";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const pathname = usePathname();

    const { canManageProperties } = useRoles();
    const { isAuthModalOpen, closeAuthModal, redirectTo } = useAuthModal();

    // Check session on initial load
    const { isLoading: isSessionLoading } = useSessionUser();

    // Ensure we react to Supabase auth state changes (OAuth callback, sign out, token refresh)
    // This hook keeps our session-dependent React Query caches in sync.
    useAuthStateSync();

    // Close global modals on route change to avoid stale UI.
    useEffect(() => {
        // Use setTimeout to avoid cascading renders
        const timer = setTimeout(() => {
            setIsModalOpen(false);
        }, 0);

        return () => clearTimeout(timer);
    }, [pathname]);

    // Show loading state while checking session on initial load
    if (isSessionLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-sm text-text-muted">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header onAddPropertyAction={() => setIsModalOpen(true)} />
            <main className="absolute top-14 sm:top-16 left-0 right-0 h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-y-auto">
                {children}
            </main>

            {/* Add Property Modal - only for admin */}
            {canManageProperties && (
                <PropertyForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}

            {/* Global Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                redirectTo={redirectTo}
            />
        </>
    );
}
