"use client";

import { useState } from "react";
import { Modal, Button, Input, Alert } from "@/components/common";
import { EmailSentSuccess } from "./EmailSentSuccess";
import type { EmailVerificationError } from "@/contexts/AuthModalContext";
import { processEmail } from "@/lib/utils/email";

interface VerificationErrorModalProps {
    /** Whether modal is open */
    isOpen: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Error information to display */
    error: EmailVerificationError | null;
    /** Callback when user wants to try a different email */
    onTryDifferentEmail: () => void;
}

export function VerificationErrorModal({
    isOpen,
    onClose,
    error,
    onTryDifferentEmail,
}: VerificationErrorModalProps) {
    const [email, setEmail] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleResend = async () => {
        const { normalized, isValid, error: validationError } = processEmail(email);

        if (!isValid) {
            setErrorMessage(validationError || "Please enter a valid email address");
            return;
        }

        try {
            setIsResending(true);
            setErrorMessage(null);

            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: normalized }),
            });

            const body = (await res.json().catch(() => null)) as
                { message?: string; error?: string } | null;

            if (!res.ok) {
                setErrorMessage(
                    body?.error || "Failed to resend verification email. Please try again."
                );
                return;
            }

            setSuccessMessage(
                body?.message || "Verification email sent. Please check your inbox."
            );
        } catch {
            setErrorMessage("Failed to resend verification email. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setSuccessMessage(null);
        setErrorMessage(null);
        onClose();
    };

    if (!error) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={successMessage ? "Check your email" : error.title}
            size="sm"
            fullWidthButtons
            primaryButton={
                successMessage
                    ? {
                          label: "Got it",
                          onClick: handleClose,
                          variant: "primary",
                      }
                    : {
                          label: "Try a different email",
                          onClick: () => {
                              handleClose();
                              onTryDifferentEmail();
                          },
                          variant: "primary",
                      }
            }
            secondaryButton={
                successMessage
                    ? undefined
                    : {
                          label: "Go to home",
                          onClick: handleClose,
                          variant: "secondary",
                      }
            }
        >
            <div className="space-y-6">
                {/* Success State - Show after resend */}
                {successMessage ? (
                    <EmailSentSuccess message={successMessage} />
                ) : (
                    <>
                        {/* Error Alert */}
                        <Alert
                            variant="error"
                            message={error.message}
                            icon={error.icon}
                        />

                        {/* Resend Form */}
                        {error.canResend && (
                            <div className="space-y-3">
                                <Input
                                    type="email"
                                    label="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    disabled={isResending}
                                    error={errorMessage || undefined}
                                    fullWidth
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    fullWidth
                                    loading={isResending}
                                    disabled={isResending}
                                    onClick={handleResend}
                                    className="border-input-border bg-card text-auth-text-strong hover:bg-hover"
                                >
                                    Resend link
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}

