"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, FileText, Heart, LogOut, Plus, Settings, User } from "lucide-react";
import { Button, Dropdown, Icon, LogoIcon, LogoText } from "@/components/common";
import type { DropdownItem } from "@/components/common";
import { useLogout } from "@/lib/hooks/auth";
import { useRoles } from "@/lib/hooks/roles";
import { useAuthModal } from "@/contexts";

interface HeaderProps {
    onAddPropertyAction?: () => void;
}

export function Header({ onAddPropertyAction }: HeaderProps) {
    const { mutate: logout, isPending } = useLogout();
    const { isAdmin, user } = useRoles();
    const { openAuthModal } = useAuthModal();

    const authButtonClassName = "h-8 sm:h-9 min-w-[76px] sm:min-w-[96px] px-3 sm:px-4";

    const dropdownItems: DropdownItem[] = [
        {
            label: "Profile",
            href: "/profile",
            icon: <Icon icon={User} size={16} />,
        },
        {
            label: "Liked properties",
            href: "/property/liked",
            icon: <Icon icon={Heart} size={16} />,
        },
        {
            label: "Applications",
            href: "/applications",
            icon: <Icon icon={FileText} size={16} />,
        },
        {
            label: "Settings",
            href: "/profile/settings",
            icon: <Icon icon={Settings} size={16} />,
        },
        {
            label: isPending ? "Logging out..." : "Logout",
            onClick: () => logout(),
            variant: "danger" as const,
            disabled: isPending,
            icon: <Icon icon={LogOut} size={16} />,
        },
    ];

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card shadow-sm"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-end gap-2 sm:gap-3" aria-label="Go to home">
                    <LogoIcon className="h-7 sm:h-8 w-auto" />
                    <LogoText className="h-5 sm:h-6 w-auto mb-0.5" />
                </Link>
                <div className="flex flex-row">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {isAdmin && (
                            <Button
                                variant="primary"
                                onClick={() => onAddPropertyAction?.()}
                                size="sm"
                                pill
                            >
                                <Icon icon={Plus} size={16} className="mr-1 sm:mr-2" />
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
                                                className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden"
                                                aria-hidden="true"
                                            >
                                                {user.image_url ? (
                                                    <Image
                                                        src={user.image_url}
                                                        alt={user.name ?? user.email}
                                                        width={32}
                                                        height={32}
                                                        className="h-8 w-8 object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    user.email?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <Icon
                                                icon={ChevronDown}
                                                size={16}
                                                className="text-text-muted"
                                            />
                                        </div>
                                    }
                                    items={dropdownItems}
                                />
                            </div>
                        ) : (
                            <Button
                                variant="primary"
                                size="sm"
                                pill
                                className={authButtonClassName}
                                onClick={() => openAuthModal()}
                            >
                                Continue with Email
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
