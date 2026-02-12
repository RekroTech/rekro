"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogin } from "@/lib/react-query/hooks/auth/useAuth";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();

    const { mutate: login, isPending, error, isSuccess } = useLogin();

    // Read query params once per render and derive safe redirect target
    const nextParam = useMemo(() => searchParams.get("next"), [searchParams]);
    const sessionError = useMemo(() => searchParams.get("error") === "session", [searchParams]);

    // Prevent open-redirects: allow only internal absolute paths
    const safeNext = useMemo(() => {
        if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
            return nextParam;
        }
        return "/dashboard";
    }, [nextParam]);

    useEffect(() => {
        if (isSuccess) {
            // replace prevents going "back" to /login after signing in
            router.replace(safeNext);
        }
    }, [isSuccess, router, safeNext]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!email || !password) return;

        login({ email, password });
    };

    return (
        <div className="auth-theme flex min-h-screen items-center justify-center bg-app-bg px-5 py-10 text-foreground">
            <div className="w-full max-w-md">
                {/* Top notice (matches mobile) */}
                <div className="mb-7 px-2 text-center">
                    <p className="text-[13px] italic text-auth-note">
                        Designed to connect, make friends, and find your next home.
                    </p>
                </div>

                {/* Card */}
                <div className="card border border-input-border px-6 py-7">
                    {/* Mascot - file should be in /public/reKro.png */}
                    <div className="mb-3 flex justify-center">
                        <div className="h-[120px] w-[120px]">
                            <Image
                                src="/icon.svg"
                                alt="reKro mascot"
                                width={120}
                                height={120}
                                className="h-full w-full object-contain"
                                priority
                            />
                        </div>
                    </div>

                    <h1 className="mb-4 text-center text-[28px] font-bold text-primary-500 dark:text-primary-300">
                        Welcome to reKro
                    </h1>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={isPending}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="input"
                            />
                        </div>

                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                disabled={isPending}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="input"
                            />
                        </div>

                        {sessionError && (
                            <div className="rounded-[10px] border border-warning-500/30 bg-warning-500/10 p-3">
                                <p className="text-sm text-warning-600 dark:text-warning-500">
                                    Your session has expired. Please log in again.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-[10px] border border-danger-500/30 bg-danger-500/10 p-3">
                                <p className="text-sm text-danger-600 dark:text-danger-500">
                                    {error.message}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="mt-2 w-full rounded-[10px] bg-primary-500 py-3.5 text-[17px] font-semibold text-white shadow-[0_4px_10px_rgba(58,127,121,0.30)] transition hover:bg-primary-600 disabled:opacity-60 dark:bg-primary-300 dark:text-[#071010] dark:hover:bg-primary-200"
                        >
                            {isPending ? "Signing In..." : "Sign In"}
                        </button>

                        <div className="pt-1 text-center">
                            <Link
                                href="/forgot-password"
                                className="text-[14px] font-medium text-primary-600 hover:opacity-80 dark:text-primary-300"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Signup + support note */}
                <div className="mt-6 text-center">
                    <p className="text-[15px] text-auth-text-strong">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-bold text-primary-600 hover:opacity-80 dark:text-primary-300"
                        >
                            Sign up
                        </Link>
                    </p>

                    <p className="mt-4 text-[13px] text-auth-support">
                        If you have trouble registering, please contact admin@rekro.com.au
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="auth-theme flex min-h-screen items-center justify-center bg-app-bg px-5 py-10">
                    <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    </div>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
