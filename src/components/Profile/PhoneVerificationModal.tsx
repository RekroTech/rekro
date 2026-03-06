"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/common/Modal";
import { Alert } from "@/components/common/Alert";
import { Icon } from "@/components/common/Icon";

interface PhoneVerificationModalProps {
    isOpen: boolean;
    phone: string;
    onClose: () => void;
    /** Called when the phone number is successfully verified */
    onVerified: (verifiedAt: string) => void;
}

type Step = "send" | "verify";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export function PhoneVerificationModal({
    isOpen,
    phone,
    onClose,
    onVerified,
}: PhoneVerificationModalProps) {
    const [step, setStep] = useState<Step>("send");
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep("send");
            setOtp(Array(OTP_LENGTH).fill(""));
            setError(null);
            setSuccess(null);
            setIsSending(false);
            setIsVerifying(false);
            setCooldown(0);
        } else {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        }
    }, [isOpen]);

    const startCooldown = useCallback(() => {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        cooldownRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleSendOtp = useCallback(async () => {
        setError(null);
        setSuccess(null);
        setIsSending(true);

        try {
            const res = await fetch("/api/user/phone-verification/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = (await res.json()) as { message?: string; error?: string };

            if (!res.ok) {
                setError(data.error ?? "Failed to send OTP. Please try again.");
                return;
            }

            setSuccess(`OTP sent to ${phone}`);
            setStep("verify");
            startCooldown();

            // Focus first OTP input after short delay
            setTimeout(() => inputRefs.current[0]?.focus(), 150);
        } catch {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setIsSending(false);
        }
    }, [phone, startCooldown]);

    const handleVerifyOtp = useCallback(async () => {
        const token = otp.join("");
        if (token.length < OTP_LENGTH) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        setError(null);
        setIsVerifying(true);

        try {
            const res = await fetch("/api/user/phone-verification/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, token }),
            });

            const data = (await res.json()) as {
                message?: string;
                verified_at?: string;
                error?: string;
            };

            if (!res.ok) {
                setError(data.error ?? "Invalid OTP. Please try again.");
                return;
            }

            onVerified(data.verified_at ?? new Date().toISOString());
        } catch {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setIsVerifying(false);
        }
    }, [otp, phone, onVerified]);

    // Handle individual OTP digit input
    const handleOtpChange = (index: number, value: string) => {
        // Accept only digits
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);

        // Auto-advance
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (pasted.length > 0) {
            e.preventDefault();
            const next = Array(OTP_LENGTH).fill("");
            pasted.split("").forEach((char, i) => {
                next[i] = char;
            });
            setOtp(next);
            const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
            inputRefs.current[nextFocus]?.focus();
        }
    };

    const otpComplete = otp.every((d) => d !== "");

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Verify Mobile Number"
            size="sm"
            primaryButton={
                step === "send"
                    ? {
                          label: isSending ? "Sending…" : "Send OTP",
                          onClick: handleSendOtp,
                          isLoading: isSending,
                          disabled: isSending,
                      }
                    : {
                          label: isVerifying ? "Verifying…" : "Verify",
                          onClick: handleVerifyOtp,
                          isLoading: isVerifying,
                          disabled: isVerifying || !otpComplete,
                          icon: "check",
                          iconPosition: "left",
                      }
            }
            secondaryButton={
                step === "verify"
                    ? {
                          label: "Back",
                          onClick: () => {
                              setStep("send");
                              setOtp(Array(OTP_LENGTH).fill(""));
                              setError(null);
                          },
                          icon: "chevron-left",
                          iconPosition: "left",
                      }
                    : {
                          label: "Cancel",
                          onClick: onClose,
                      }
            }
        >
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Icon name="shield" className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <p className="text-sm text-text-muted">
                            {step === "send"
                                ? "We'll send a 6-digit code to:"
                                : "Enter the 6-digit code sent to:"}
                        </p>
                        <p className="text-sm font-semibold text-foreground">{phone}</p>
                    </div>
                </div>

                {/* Status messages */}
                {error && <Alert variant="error" message={error} />}
                {success && step === "verify" && <Alert variant="success" message={success} />}

                {/* OTP digit inputs (only shown on verify step) */}
                {step === "verify" && (
                    <div className="space-y-3">
                        <p className="text-sm text-text-muted text-center">
                            Enter the verification code
                        </p>
                        <div
                            className="flex items-center justify-center gap-2"
                            onPaste={handleOtpPaste}
                        >
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => {
                                        inputRefs.current[i] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    className="w-11 h-14 text-center text-xl font-bold rounded-lg border border-border bg-card text-foreground
                                               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                                               transition-all caret-primary-500"
                                    aria-label={`OTP digit ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Resend button */}
                        <div className="text-center">
                            {cooldown > 0 ? (
                                <p className="text-xs text-text-subtle">
                                    Resend code in{" "}
                                    <span className="font-semibold text-primary-500">
                                        {cooldown}s
                                    </span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={isSending}
                                    className="text-xs text-primary-500 hover:text-primary-600 font-semibold underline underline-offset-2 disabled:opacity-50"
                                >
                                    {isSending ? "Sending…" : "Resend code"}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Info note */}
                <p className="text-xs text-text-subtle text-center">
                    Standard SMS rates may apply. Code expires in 10 minutes.
                </p>
            </div>
        </Modal>
    );
}

