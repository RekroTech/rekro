"use client";

import Image from "next/image";
import { Dropdown, Icon } from "@/components/common";
import { useLogout, useUser } from "@/lib/react-query/hooks/useAuth";

export function Header() {
    const { data: user } = useUser();
    const { mutate: logout, isPending } = useLogout();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card shadow-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 overflow-hidden rounded-[10px]">
                        <Image
                            src="/reKro.png"
                            alt="reKro"
                            width={32}
                            height={32}
                            className="h-full w-full object-contain"
                            priority
                        />
                    </div>

                    <div className="flex items-baseline gap-2">
                        <h1 className="text-[20px] font-bold text-primary-600">reKro</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {user && (
                        <Dropdown
                            align="right"
                            trigger={
                                <div className="flex items-center gap-2 rounded-[var(--radius-lg)] px-3 py-2 hover:bg-surface-muted transition-colors cursor-pointer">
                                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:block text-sm text-text">
                                        {user.email}
                                    </span>
                                    <Icon name="chevron-down" className="w-4 h-4 text-text-muted" />
                                </div>
                            }
                            items={[
                                {
                                    label: "Profile",
                                    onClick: () => {
                                        // TODO: Navigate to profile page
                                    },
                                    icon: <Icon name="profile" className="w-4 h-4" />,
                                },
                                {
                                    label: "Settings",
                                    onClick: () => {
                                        // TODO: Navigate to settings page
                                    },
                                    icon: <Icon name="settings" className="w-4 h-4" />,
                                },
                                {
                                    label: isPending ? "Logging out..." : "Logout",
                                    onClick: () => logout(),
                                    variant: "danger" as const,
                                    disabled: isPending,
                                    icon: <Icon name="logout" className="w-4 h-4" />,
                                },
                            ]}
                        />
                    )}
                </div>
            </div>
        </nav>
    );
}
