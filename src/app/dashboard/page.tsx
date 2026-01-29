"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/common";
import { useLogout, useUser } from "@/lib/react-query/hooks/useAuth";

export default function DashboardPage() {
    const router = useRouter();
    const { data: user, isLoading } = useUser();
    const { mutate: logout, isPending } = useLogout();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-app-bg">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-2 text-text-muted">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg text-foreground">
            {/* Top Nav */}
            <nav className="border-b border-border bg-card">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        {/* Logo (optional) - put /public/reKro.png */}
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
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Welcome card */}
                <div className="card-lg border border-border p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-text">Welcome, {user.name}!</h2>
                            <p className="mt-1 text-text-muted">
                                This is a protected page. Only authenticated users can access this
                                content.
                            </p>
                        </div>

                        <div className="mt-3 sm:mt-0">
                            <span className="inline-flex items-center gap-2 rounded-[9999px] bg-success-bg px-3 py-1 text-sm font-semibold text-primary-700">
                                Authenticated ✓
                            </span>
                        </div>
                    </div>

                    {/* Info grid */}
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                            <h3 className="font-semibold text-text">User ID</h3>
                            <p className="mt-1 break-all text-sm text-text-muted">{user.id}</p>
                        </div>

                        <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                            <h3 className="font-semibold text-text">Email</h3>
                            <p className="mt-1 text-sm text-text-muted">{user.email}</p>
                        </div>

                        <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                            <h3 className="font-semibold text-text">Status</h3>
                            <p className="mt-1 text-sm font-semibold text-primary-700">
                                Authenticated ✓
                            </p>
                        </div>
                    </div>

                    {/* Quick actions (optional, matches mobile “pill buttons” vibe) */}
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/account"
                            className="pill inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-text hover:opacity-90"
                        >
                            Go to Account
                        </Link>
                        <Link
                            href="/accommodations"
                            className="btn-primary-pill inline-flex items-center justify-center"
                        >
                            Browse Accommodations
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
