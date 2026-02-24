"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header, PropertyForm } from "@/components";
import { useRoles } from "@/lib/react-query/hooks/roles";
import { AuthModal } from "@/components/Auth";
import { useAuthModal } from "@/contexts";
import { useAuthStateSync } from "@/lib/react-query/hooks/auth";

type AppShellProps = {
    children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const pathname = usePathname();

    const { canManageProperties } = useRoles();
    const { isAuthModalOpen, closeAuthModal, redirectTo } = useAuthModal();

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

    return (
        <>
            <Header onAddPropertyAction={() => setIsModalOpen(true)} />
            <div className="pt-14 sm:pt-16">{children}</div>

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
