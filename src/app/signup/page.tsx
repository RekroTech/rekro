"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSignup } from "@/lib/react-query/hooks/useAuth";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const { mutate: signup, isPending, isSuccess, error } = useSignup();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        signup({ email, password, name });
    };

    return (
        <div className="auth-theme flex min-h-screen items-center justify-center bg-app-bg px-5 py-10 text-foreground">
            <div className="w-full max-w-md">
                {/* Top notice (consistent with login) */}
                <div className="mb-7 px-2 text-center">
                    <p className="text-[13px] italic text-auth-note">
                        Create your account to connect, make friends, and find your next home.
                    </p>
                </div>

                {/* Card */}
                <div className="card border border-emerald-100 px-6 py-7">
                    <h1 className="mb-1 text-center text-[28px] font-bold text-primary-600">
                        Create your account
                    </h1>
                    <p className="mb-5 text-center text-sm text-text-muted">
                        Sign up to get started with reKro
                    </p>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-medium text-text"
                            >
                                Name (optional)
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="input"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-text"
                            >
                                Email address
                            </label>
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
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-text"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password (min 6 characters)"
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

                        {isSuccess && (
                            <div className="rounded-[10px] bg-success-bg p-3">
                                <p className="text-sm font-medium text-primary-700">
                                    Account created successfully! Redirecting…
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending || isSuccess}
                            className="mt-2 w-full rounded-[10px] bg-primary-500 py-3.5 text-[17px] font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
                            style={{ boxShadow: "0 4px 10px rgba(58, 127, 121, 0.30)" }}
                        >
                            {isPending ? "Creating account..." : isSuccess ? "Success!" : "Sign up"}
                        </button>

                        <div className="pt-2 text-center">
                            <p className="text-[15px] text-auth-text-strong">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-bold text-secondary-500 hover:opacity-80"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-text-subtle">
                    By continuing, you agree to our Terms and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
