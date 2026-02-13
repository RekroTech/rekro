"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignup } from "@/lib/react-query/hooks/auth/useAuth";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState("");

    const router = useRouter();
    const redirectTimerRef = useRef<number | null>(null);

    const { mutate: signup, isPending, isSuccess, error } = useSignup();

    useEffect(() => {
        if (!isSuccess) return;

        // Redirect after successful signup (with cleanup)
        redirectTimerRef.current = window.setTimeout(() => {
            router.replace("/dashboard");
        }, 2000);

        return () => {
            if (redirectTimerRef.current !== null) {
                window.clearTimeout(redirectTimerRef.current);
                redirectTimerRef.current = null;
            }
        };
    }, [isSuccess, router]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setValidationError("");

        const trimmedEmail = email.trim();

        // Client-side validation
        if (!trimmedEmail || !password) {
            setValidationError("Email and password are required");
            return;
        }

        if (password.length < 6) {
            setValidationError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setValidationError("Passwords do not match");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setValidationError("Please enter a valid email address");
            return;
        }

        signup({ email: trimmedEmail, password });
    };

    const isDisabled = isPending || isSuccess;

    return (
        <div className="auth-theme flex min-h-screen items-center justify-center bg-app-bg px-5 py-10 text-foreground">
            <div className="w-full max-w-md">
                {/* Top notice (consistent with login) */}
                <div className="mb-7 px-2 text-center">
                    <p className="text-[13px] italic text-auth-note">
                        Save your favourite properties, connect with housemates, and apply once to live anywhere.
                    </p>
                </div>

                {/* Card */}
                <div className="card border border-input-border px-6 py-6">
                    <h1 className="mb-4 text-center text-[28px] font-bold text-primary-500 dark:text-primary-300">
                        Create your account
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
                                disabled={isDisabled}
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
                                autoComplete="new-password"
                                required
                                value={password}
                                disabled={isDisabled}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password (min 6 characters)"
                                className="input"
                            />
                        </div>

                        <div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                disabled={isDisabled}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                className="input"
                            />
                        </div>

                        {validationError && (
                            <div className="rounded-[10px] bg-warning-500/10 border border-warning-500/30 p-3">
                                <p className="text-sm text-warning-600 dark:text-warning-500">
                                    {validationError}
                                </p>
                            </div>
                        )}

                        {error?.message && (
                            <div className="rounded-[10px] bg-danger-500/10 border border-danger-500/30 p-3">
                                <p className="text-sm text-danger-600 dark:text-danger-500">
                                    {error.message}
                                </p>
                            </div>
                        )}

                        {isSuccess && (
                            <div className="rounded-[10px] bg-success-bg border border-primary-500/30 p-3">
                                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                    Account created successfully! Redirecting…
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isDisabled}
                            className="mt-2 w-full rounded-[10px] bg-primary-500 py-3.5 text-[17px] font-semibold text-white shadow-[0_4px_10px_rgba(58,127,121,0.30)] transition hover:bg-primary-600 disabled:opacity-60 dark:bg-primary-300 dark:text-[#071010] dark:hover:bg-primary-200"
                        >
                            {isPending ? "Creating account..." : isSuccess ? "Success!" : "Sign up"}
                        </button>

                        <div className="pt-2 text-center">
                            <p className="text-[15px] text-auth-text-strong">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-bold text-primary-600 hover:opacity-80 dark:text-primary-300"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-text-subtle">
                    By continuing, you agree to our{" "}
                    <Link
                        href="https://www.rekro.com.au/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:opacity-80 dark:text-primary-300"
                    >
                        Terms
                    </Link>
                    {" "}and{" "}
                    <Link
                        href="https://www.rekro.com.au/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:opacity-80 dark:text-primary-300"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
