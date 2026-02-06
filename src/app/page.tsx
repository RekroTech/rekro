import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";

// Metadata for SEO
export const metadata: Metadata = {
    title: "Welcome to Rekro - Find Your Next Home",
    description:
        "Designed to connect, make friends, and find your next home. Browse properties, connect with landlords, and discover your perfect rental.",
};

// This page needs to be dynamic because it checks user session
export const dynamic = "force-dynamic";

export default async function HomePage() {
    const user = await getSession();

    return (
        <div className="flex min-h-screen items-center justify-center bg-app-bg">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between gap-12 px-6 py-20 bg-card sm:items-start sm:px-16 sm:py-32">
                {/* Logo */}
                <Image
                    className="dark:invert"
                    src="/next.svg"
                    alt="Next.js logo"
                    width={100}
                    height={20}
                    priority
                />

                {/* Hero Content */}
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-xs text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl">
                        Welcome to Rekro
                    </h1>
                    <p className="max-w-md text-lg leading-relaxed text-text-muted">
                        {user ? (
                            <>
                                You are logged in as{" "}
                                <span className="font-medium text-text">{user.email}</span>. Go to
                                your dashboard to see protected content.
                            </>
                        ) : (
                            <>
                                This is a public page. Sign in to access your dashboard and
                                protected content.
                            </>
                        )}
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
                    {user ? (
                        <Link
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-primary-500 px-6 text-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-primary-600 active:bg-primary-700 md:w-auto"
                            href="/dashboard"
                            prefetch={true}
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-primary-500 px-6 text-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:bg-primary-600 active:bg-primary-700 md:w-auto"
                                href="/login"
                                prefetch={true}
                            >
                                Sign In
                            </Link>
                            <Link
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] border-2 border-primary-500 bg-transparent px-6 text-primary-500 transition-all duration-200 hover:bg-primary-50 active:bg-primary-100 md:w-auto"
                                href="/signup"
                                prefetch={true}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
