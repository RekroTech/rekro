"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogin, useGoogleLogin } from "@/lib/react-query/hooks/auth/useAuth";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();

    const { mutate: login, isPending, error, isSuccess } = useLogin();
    const { mutate: loginWithGoogle, isPending: isGooglePending, error: googleError } = useGoogleLogin();

    // Read query params once per render and derive safe redirect target
    const nextParam = useMemo(() => searchParams.get("next"), [searchParams]);
    const sessionError = useMemo(() => searchParams.get("error") === "session", [searchParams]);
    const oauthError = useMemo(() => searchParams.get("error") === "oauth_failed", [searchParams]);

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

    const handleGoogleLogin = () => {
        loginWithGoogle(safeNext);
    };

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

                        {oauthError && (
                            <div className="rounded-[10px] border border-danger-500/30 bg-danger-500/10 p-3">
                                <p className="text-sm text-danger-600 dark:text-danger-500">
                                    Google sign-in failed. Please try again.
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

                        {googleError && (
                            <div className="rounded-[10px] border border-danger-500/30 bg-danger-500/10 p-3">
                                <p className="text-sm text-danger-600 dark:text-danger-500">
                                    {googleError.message}
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

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-input-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-card px-4 text-auth-text-strong">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isGooglePending || isPending}
                            className="w-full rounded-[10px] border border-input-border bg-card py-3.5 text-[17px] font-semibold text-auth-text-strong transition hover:bg-hover disabled:opacity-60 flex items-center justify-center gap-3"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            {isGooglePending ? "Signing in..." : "Sign in with Google"}
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
