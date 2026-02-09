"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header, PropertyForm } from "@/components";
import { useCanManageProperties } from "@/hooks/useRoles";
import { useUser } from "@/lib/react-query/hooks/auth";

type AppShellProps = {
    children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const pathname = usePathname();

    const { data: user } = useUser();
    const canManageProperties = useCanManageProperties(user ?? null);

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
            <div className="pt-16">{children}</div>

            {/* Add Property Modal - only for admin/landlord */}
            {canManageProperties && (
                <PropertyForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}
