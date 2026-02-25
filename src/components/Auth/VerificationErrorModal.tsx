"use client";

import { useState } from "react";
import { Modal, Button, Input, Alert } from "@/components/common";
import { EmailSentSuccess } from "./EmailSentSuccess";
import type { EmailVerificationError } from "@/contexts/AuthModalContext";
import { processEmail } from "@/lib/utils/email";
import { useSignInWithOtp } from "@/lib/react-query/hooks/auth";

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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const signInWithOtp = useSignInWithOtp();

    const handleResend = () => {
        const { normalized, isValid, error: validationError } = processEmail(email);

        if (!isValid) {
            setErrorMessage(validationError || "Please enter a valid email address");
            return;
        }

        setErrorMessage(null);

        signInWithOtp.mutate(
            { email: normalized },
            {
                onSuccess: () => {
                    setSuccessMessage("Verification email sent. Please check your inbox.");
                },
                onError: (err) => {
                    setErrorMessage(
                        err instanceof Error
                            ? err.message
                            : "Failed to resend verification email. Please try again."
                    );
                },
            }
        );
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
                                    disabled={signInWithOtp.isPending}
                                    error={errorMessage || undefined}
                                    fullWidth
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    fullWidth
                                    loading={signInWithOtp.isPending}
                                    disabled={signInWithOtp.isPending}
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

