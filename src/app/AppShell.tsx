"use client";

import React, { lazy, Suspense } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Header, Footer } from "@/components/layout";
import { Loader } from "@/components/common";
import { useAuthStateSync, useSessionUser } from "@/lib/hooks/auth";
import { useRoles } from "@/lib/hooks/roles";
import { useAuthModal, usePropertyFormModal } from "@/contexts";

// Lazy-load modals to reduce initial bundle size
const AuthModal = lazy(() =>
    import("@/components/Auth/AuthModal").then((mod) => ({ default: mod.AuthModal }))
);

const PropertyForm = dynamic(
    () => import("@/components/PropertyForm").then((mod) => ({ default: mod.PropertyForm })),
    {
        loading: () => <Loader size="md" />,
        ssr: false,
    }
);

interface AppShellProps {
    children: React.ReactNode;
}

/**
 * AppShell - Unified Layout & Modal Manager
 *
 * Single component handling:
 * - Auth state sync & session check
 * - Layout structure (header, main, footer)
 * - Auth and PropertyForm modals
 * - Loading state
 *
 * Simple and maintainable structure.
 */
export default function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const { isLoading: isSessionLoading, data: user } = useSessionUser();
    const { isAdmin } = useRoles();

    // Sync auth state with Supabase
    useAuthStateSync();

    // Modal states
    const { isAuthModalOpen, closeAuthModal, redirectTo, authModalError } = useAuthModal();
    const { isOpen: isPropertyFormOpen, closeModal: closePropertyForm } = usePropertyFormModal();

    // Show loading state while checking session
    if (isSessionLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <Loader size="md" text="Loading..." />
            </div>
        );
    }

    return (
        <>
            <a
                href="#main-content"
                onClick={(e) => {
                    e.preventDefault();
                    const mainContent = document.getElementById("main-content");
                    if (mainContent) {
                        mainContent.focus();
                        mainContent.scrollTop = 0;
                    }
                }}
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-primary-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none"
            >
                Skip to main content
            </a>

            <Header />
            <main
                id="main-content"
                role="main"
                tabIndex={-1}
                className="mt-14 sm:mt-16 outline-none"
            >
                {children}
            </main>
            {!user && <Footer />}

            {/* Global Modals */}
            <Suspense fallback={null}>
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={closeAuthModal}
                    redirectTo={redirectTo}
                    initialError={authModalError}
                />
            </Suspense>

            {isAdmin && (
                <PropertyForm
                    key={pathname}
                    isOpen={isPropertyFormOpen}
                    onClose={closePropertyForm}
                />
            )}
        </>
    );
}
