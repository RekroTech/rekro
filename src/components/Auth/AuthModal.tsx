"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Modal, Icon, Button, Input, Alert } from "@/components/common";
import { useSignInWithOtp, useGoogleLogin } from "@/lib/hooks";
import { processEmail } from "@/lib/utils";
import { EmailSentSuccess } from "./EmailSentSuccess";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    redirectTo?: string;
}

export type { AuthModalProps };

type AuthStep = "email-entry" | "check-email";

const RESEND_COOLDOWN_SECONDS = 60;

export function AuthModal({ isOpen, onClose, redirectTo = "/" }: AuthModalProps) {
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<AuthStep>("email-entry");
    const [countdown, setCountdown] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");

    const { mutate: signInWithOtp, isPending, error } = useSignInWithOtp();
    const {
        mutate: loginWithGoogle,
        isPending: isGooglePending,
        error: googleError,
    } = useGoogleLogin();

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
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

    // Handle errors from mutations
    useEffect(() => {
        if (error || googleError) {
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

        const { normalized, isValid, error: validationError } = processEmail(email);

        if (!isValid) {
            setErrorMessage(validationError || "Please enter a valid email address");
            return;
        }

        setErrorMessage("");
        signInWithOtp(
            { email: normalized, redirectTo },
            {
                onSuccess: () => {
                    setStep("check-email");
                    setCountdown(RESEND_COOLDOWN_SECONDS);
                },
            }
        );
    };

    const handleResend = () => {
        if (countdown > 0) return;

        const { normalized, isValid, error: validationError } = processEmail(email);

        if (!isValid) {
            setErrorMessage(validationError || "Please enter a valid email address");
            return;
        }

        signInWithOtp(
            { email: normalized, redirectTo },
            {
                onSuccess: () => {
                    setCountdown(RESEND_COOLDOWN_SECONDS);
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
                            Enter your email to continue. We&apos;ll send you a magic link to sign
                            in.
                        </p>

                        <form onSubmit={handleSubmitEmail} className="space-y-4">
                            <Input
                                id="auth-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                disabled={isPending}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                error={errorMessage || undefined}
                                autoFocus
                                fullWidth
                            />

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
                                {!isGooglePending && (
                                    <Icon name="google" className="h-5 w-5 mr-2" />
                                )}
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
                                </a>{" "}
                                and{" "}
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
                        <EmailSentSuccess email={email} />

                        {errorMessage && (
                            <Alert variant="error" message={errorMessage} className="mb-4" />
                        )}

                        <div className="space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                fullWidth
                                loading={isPending}
                                disabled={countdown > 0 || isPending}
                                onClick={handleResend}
                                className="border-input-border bg-card text-auth-text-strong hover:bg-hover"
                            >
                                {countdown > 0
                                    ? `Resend link in ${countdown}s`
                                    : isPending
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
