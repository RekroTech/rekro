"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { Button } from "./Button";
import { useSignInWithOtp, useResendOtp, useGoogleLogin } from "@/lib/react-query/hooks/auth/useAuth";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    redirectTo?: string;
}

export type { AuthModalProps };

type AuthStep = "email-entry" | "check-email" | "error";

export function AuthModal({ isOpen, onClose, redirectTo = "/dashboard" }: AuthModalProps) {
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<AuthStep>("email-entry");
    const [countdown, setCountdown] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");

    const { mutate: signInWithOtp, isPending, error } = useSignInWithOtp();
    const { mutate: resendOtp, isPending: isResending } = useResendOtp();
    const { mutate: loginWithGoogle, isPending: isGooglePending, error: googleError } = useGoogleLogin();

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Use setTimeout to avoid setState in effect warning
            const timer = setTimeout(() => {
                setEmail("");
                setStep("email-entry");
                setCountdown(0);
                setErrorMessage("");
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle errors
    useEffect(() => {
        if (error || googleError) {
            // Use setTimeout to avoid setState in effect warning
            const timer = setTimeout(() => {
                const errorMsg = error?.message || googleError?.message || "";
                if (errorMsg.includes("rate") || errorMsg.includes("too many")) {
                    setErrorMessage("Too many requests. Please wait a moment and try again.");
                } else if (errorMsg) {
                    setErrorMessage(errorMsg);
                }
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [error, googleError]);

    const handleSubmitEmail = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setErrorMessage("Please enter a valid email address");
            return;
        }

        setErrorMessage("");
        signInWithOtp(
            { email: trimmedEmail, redirectTo },
            {
                onSuccess: () => {
                    setStep("check-email");
                    setCountdown(60); // 60 second cooldown
                },
            }
        );
    };

    const handleResend = () => {
        if (countdown > 0) return;

        const trimmedEmail = email.trim().toLowerCase();
        resendOtp(
            { email: trimmedEmail, redirectTo },
            {
                onSuccess: () => {
                    setCountdown(60);
                    setErrorMessage("");
                },
                onError: (err) => {
                    setErrorMessage(err.message);
                },
            }
        );
    };

    const handleUseDifferentEmail = () => {
        setEmail("");
        setStep("email-entry");
        setCountdown(0);
        setErrorMessage("");
    };

    const handleGoogleLogin = () => {
        setErrorMessage("");
        loginWithGoogle(redirectTo);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="p-6 sm:p-8">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                    <div className="h-[120px] w-[120px]">
                        <Image
                            src="/icon.svg"
                            alt="reKro logo"
                            width={120}
                            height={120}
                            className="h-full w-full object-contain"
                            priority
                        />
                    </div>
                </div>

                {step === "email-entry" && (
                    <>
                        <h2 className="text-center text-2xl font-bold text-foreground mb-2">
                            Welcome to reKro
                        </h2>
                        <p className="text-center text-sm text-text-muted mb-6">
                            Enter your email to continue. We&apos;ll send you a magic link to sign in.
                        </p>

                        <form onSubmit={handleSubmitEmail} className="space-y-4">
                            <div>
                                <input
                                    id="auth-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    disabled={isPending}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="input"
                                    autoFocus
                                />
                            </div>

                            {errorMessage && (
                                <div className="rounded-[10px] border border-danger-500/30 bg-danger-500/10 p-3">
                                    <p className="text-sm text-danger-600 dark:text-danger-500">
                                        {errorMessage}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={isPending}
                                disabled={isPending || isGooglePending}
                            >
                                Continue with email
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-input-border"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-card px-4 text-auth-text-strong">Or</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                fullWidth
                                loading={isGooglePending}
                                disabled={isPending || isGooglePending}
                                onClick={handleGoogleLogin}
                                className="border-input-border bg-card text-auth-text-strong hover:bg-hover"
                            >
                                {!isGooglePending && <Icon name="google" className="h-5 w-5 mr-2" />}
                                Continue with Google
                            </Button>

                            <p className="text-center text-xs text-text-subtle mt-4">
                                By continuing, you agree to reKro&apos;s{" "}
                                <a
                                    href="https://www.rekro.com.au/terms-and-conditions"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:opacity-80 dark:text-primary-300"
                                >
                                    Terms
                                </a>
                                {" "}and{" "}
                                <a
                                    href="https://www.rekro.com.au/privacy-policy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 hover:opacity-80 dark:text-primary-300"
                                >
                                    Privacy Policy
                                </a>
                                .
                            </p>
                        </form>
                    </>
                )}

                {step === "check-email" && (
                    <>
                        <h2 className="text-center text-2xl font-bold text-foreground mb-2">
                            Check your email
                        </h2>
                        <p className="text-center text-sm text-text-muted mb-6">
                            We sent a magic link to <strong className="text-foreground">{email}</strong>
                        </p>

                        <div className="rounded-[10px] bg-primary-500/10 border border-primary-500/30 p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Icon name="info" className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-primary-600 dark:text-primary-400">
                                    <p className="font-semibold mb-1">Click the link in your email to continue</p>
                                    <p>The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.</p>
                                </div>
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="rounded-[10px] border border-danger-500/30 bg-danger-500/10 p-3 mb-4">
                                <p className="text-sm text-danger-600 dark:text-danger-500">
                                    {errorMessage}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                fullWidth
                                loading={isResending}
                                disabled={countdown > 0 || isResending}
                                onClick={handleResend}
                                className="border-input-border bg-card text-auth-text-strong hover:bg-hover"
                            >
                                {countdown > 0
                                    ? `Resend link in ${countdown}s`
                                    : isResending
                                    ? "Sending..."
                                    : "Resend link"}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="md"
                                fullWidth
                                onClick={handleUseDifferentEmail}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-300"
                            >
                                Use a different email
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

