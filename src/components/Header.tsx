"use client";

import Image from "next/image";
import { Button } from "@/components/common";
import { useLogout, useUser } from "@/lib/react-query/hooks/useAuth";

export function Header() {
    const { data: user } = useUser();
    const { mutate: logout, isPending } = useLogout();

    return (
        <nav className="border-b border-border bg-card">
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
                        <>
                            <span className="hidden text-sm text-text-muted sm:block">
                                {user.email}
                            </span>
                            <Button
                                onClick={() => logout()}
                                variant="danger"
                                size="sm"
                                loading={isPending}
                            >
                                Logout
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
