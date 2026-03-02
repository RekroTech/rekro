"use client";

// React & Next.js
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Components
import { Header } from "@/components/layout/Header";
import { Loader } from "@/components/common";

// Hooks & Context
import { useRoles } from "@/lib/hooks/roles";
import { useAuthModal } from "@/contexts";
import { useAuthStateSync, useSessionUser } from "@/lib/hooks/auth";

// Lazy-loaded components (reduce initial bundle by ~200KB)
const PropertyForm = dynamic(
    () => import("@/components/PropertyForm").then((mod) => ({ default: mod.PropertyForm })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <Loader size="md" />
            </div>
        ),
        ssr: false,
    }
);

const AuthModal = dynamic(
    () => import("@/components/Auth").then((mod) => ({ default: mod.AuthModal })),
    {
        loading: () => null,
        ssr: false,
    }
);

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
            {/* Skip to main content link for keyboard users */}
            <a
                href="#main-content"
                onClick={(e) => {
                    e.preventDefault();
                    const mainContent = document.getElementById('main-content');
                    mainContent?.focus();
                }}
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-primary-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
            >
                Skip to main content
            </a>

            <Header onAddPropertyAction={() => setIsModalOpen(true)} />
            <main
                id="main-content"
                role="main"
                tabIndex={-1}
                className="absolute top-14 sm:top-16 left-0 right-0 h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-y-auto"
            >
                {children}
            </main>

            {/* Add Property Modal - only for admin */}
            {canManageProperties && (
                <PropertyForm
                    key={pathname}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
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
