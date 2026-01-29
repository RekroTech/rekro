"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLogin } from "@/lib/react-query/hooks/useAuth";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { mutate: login, isPending, error } = useLogin();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                <div className="card border border-emerald-100 px-6 py-7">
                    {/* Mascot - file should be in /public/Roro.png */}
                    <div className="mb-3 flex justify-center">
                        <div className="h-[120px] w-[120px]">
                            <Image
                                src="/reKro.png"
                                alt="Roro"
                                width={120}
                                height={120}
                                className="h-full w-full object-contain"
                                priority
                            />
                        </div>
                    </div>

                    <h1 className="mb-4 text-center text-[28px] font-bold text-primary-600">
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="input"
                            />
                        </div>

                        {error && (
                            <div className="rounded-[10px] bg-danger-500/10 p-3">
                                <p className="text-sm text-danger-600">
                                    {error.message || "An error occurred"}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="mt-2 w-full rounded-[10px] bg-primary-500 py-3.5 text-[17px] font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
                            style={{ boxShadow: "0 4px 10px rgba(58, 127, 121, 0.30)" }}
                        >
                            {isPending ? "Signing In..." : "Sign In"}
                        </button>

                        <div className="pt-1 text-center">
                            <Link
                                href="/forgot-password"
                                className="text-[14px] font-medium text-secondary-500 hover:opacity-80"
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
                            className="font-bold text-secondary-500 hover:opacity-80"
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
                <div className="auth-theme flex min-h-screen items-center justify-center bg-app-bg">
                    <div className="text-text-muted">Loading...</div>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
