"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Dropdown, Icon } from "@/components/common";
import { useLogout, useUser } from "@/lib/react-query/hooks/auth/useAuth";
import { useCanManageProperties } from "@/hooks/useRoles";

type HeaderProps = {
    onAddPropertyAction?: () => void;
};

export function Header({ onAddPropertyAction }: HeaderProps) {
    const { data: user } = useUser();
    const { mutate: logout, isPending } = useLogout();
    const canManageProperties = useCanManageProperties(user ?? null);

    const authButtonClassName = "h-8 sm:h-9 min-w-[76px] sm:min-w-[96px] px-3 sm:px-4";

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card shadow-sm"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-end gap-2.5 sm:gap-3" aria-label="Go to home">
                    <Image
                        src="/icon.svg"
                        alt="reKro logo"
                        width={32}
                        height={32}
                        className="h-8 w-auto"
                        priority
                    />
                    <Image
                        src="/logo-text.svg"
                        alt="reKro"
                        width={100}
                        height={32}
                        className="h-6 w-auto mb-0.5"
                        priority
                    />
                </Link>
                <div className="flex flex-row">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {canManageProperties && (
                            <Button
                                variant="primary"
                                onClick={() => onAddPropertyAction?.()}
                                size="sm"
                                className="h-8 sm:h-9"
                            >
                                <Icon name="plus" className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline font-normal">Add Property</span>
                                <span className="inline sm:hidden font-normal">Add</span>
                            </Button>
                        )}
                        {user ? (
                            <div className="[&_button]:!ring-0 [&_button]:!ring-offset-0 [&_button]:hover:!opacity-100">
                                <Dropdown
                                    align="right"
                                    trigger={
                                        <div className="flex items-center gap-1 sm:gap-2 rounded-[10px] py-1.5 sm:py-2 cursor-pointer">
                                            <div
                                                className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm"
                                                aria-hidden="true"
                                            >
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="hidden sm:block text-sm text-text">
                                                {user.email}
                                            </span>
                                            <Icon
                                                name="chevron-down"
                                                className="w-4 h-4 text-text-muted"
                                                aria-hidden="true"
                                            />
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
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <Link href="/login" className="shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        pill
                                        className={authButtonClassName}
                                    >
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/signup" className="shrink-0">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        pill
                                        className={authButtonClassName}
                                    >
                                        Sign Up
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
