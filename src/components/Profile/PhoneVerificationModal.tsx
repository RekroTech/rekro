"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, ChevronLeft, Check } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useToast } from "@/hooks/useToast";

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

/** Circular countdown SVG ring */
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const progress = seconds / total;
    const dashOffset = circumference * (1 - progress);

    return (
        <div className="relative inline-flex items-center justify-center w-12 h-12">
            <svg className="absolute inset-0 -rotate-90" width="48" height="48" viewBox="0 0 48 48">
                {/* Track */}
                <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-border opacity-40"
                />
                {/* Progress */}
                <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="text-primary-500 transition-all duration-1000 ease-linear"
                />
            </svg>
            <span className="text-xs font-bold text-primary-500 tabular-nums">{seconds}s</span>
        </div>
    );
}

export function PhoneVerificationModal({
    isOpen,
    phone,
    onClose,
    onVerified,
}: PhoneVerificationModalProps) {
    const { showError } = useToast();
    const [step, setStep] = useState<Step>("send");
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep("send");
            setOtp(Array(OTP_LENGTH).fill(""));
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
        setIsSending(true);
        try {
            const res = await fetch("/api/user/phone-verification/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = (await res.json()) as { message?: string; error?: string };
            if (!res.ok) {
                showError(data.error ?? "Failed to send OTP. Please try again.");
                return;
            }
            setStep("verify");
            setOtp(Array(OTP_LENGTH).fill(""));
            startCooldown();
            setTimeout(() => inputRefs.current[0]?.focus(), 150);
        } catch {
            showError("Network error. Please check your connection and try again.");
        } finally {
            setIsSending(false);
        }
    }, [phone, startCooldown, showError]);

    const handleVerifyOtp = useCallback(async () => {
        const token = otp.join("");
        if (token.length < OTP_LENGTH) {
            showError("Please enter the complete 6-digit code.");
            return;
        }
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
                showError(data.error ?? "Invalid code. Please try again.");
                setOtp(Array(OTP_LENGTH).fill(""));
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
                return;
            }
            onVerified(data.verified_at ?? new Date().toISOString());
        } catch {
            showError("Network error. Please check your connection and try again.");
        } finally {
            setIsVerifying(false);
        }
    }, [otp, phone, onVerified, showError]);

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (otp[index]) {
                const next = [...otp];
                next[index] = "";
                setOtp(next);
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
        if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (pasted.length > 0) {
            e.preventDefault();
            const next = Array(OTP_LENGTH).fill("");
            pasted.split("").forEach((char, i) => { next[i] = char; });
            setOtp(next);
            const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
            inputRefs.current[nextFocus]?.focus();
        }
    };

    const otpComplete = otp.every((d) => d !== "");

    const handleBack = () => {
        setStep("send");
        setOtp(Array(OTP_LENGTH).fill(""));
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        setCooldown(0);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Verify Mobile Number"
            size="sm"
        >
            <div className="space-y-6">

                {/* Phone display */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-1">
                        <Icon icon={Phone} size={20} className="text-primary-500" />
                    </div>
                    <p className="text-xs text-text-muted uppercase tracking-widest font-medium">
                        {step === "send" ? "Send code to" : "Code sent to"}
                    </p>
                    <p className="text-base font-bold text-foreground tracking-wide">{phone}</p>
                </div>

                {/* ── SEND STEP ── */}
                {step === "send" && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-surface-subtle p-4 text-center">
                            <p className="text-sm text-text-muted leading-relaxed">
                                We&apos;ll send a{" "}
                                <span className="font-semibold text-foreground">6-digit verification code</span>{" "}
                                via SMS. Standard rates may apply.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <Button
                                variant="primary"
                                loading={isSending}
                                disabled={isSending}
                                onClick={handleSendOtp}
                            >
                                {isSending ? "Sending…" : "Send OTP"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── VERIFY STEP ── */}
                {step === "verify" && (
                    <div className="space-y-5">
                        {/* OTP inputs */}
                        <div
                            className="flex items-center justify-center gap-2 sm:gap-3"
                            onPaste={handleOtpPaste}
                        >
                            {otp.map((digit, i) => (
                                <Input
                                    key={i}
                                    ref={(el) => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    fullWidth={false}
                                    className={[
                                        "!w-11 !h-14 text-center !text-2xl !font-bold !px-0",
                                        digit ? "border-primary-400 bg-primary-500/5" : "",
                                    ].join(" ")}
                                    aria-label={`Digit ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Resend row */}
                        <div className="flex items-center justify-center gap-3">
                            {cooldown > 0 ? (
                                <>
                                    <CountdownRing seconds={cooldown} total={RESEND_COOLDOWN_SECONDS} />
                                    <p className="text-sm text-text-muted">
                                        Resend available in{" "}
                                        <span className="font-semibold text-foreground">{cooldown}s</span>
                                    </p>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <span>Didn&apos;t receive the code?</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSendOtp}
                                        loading={isSending}
                                        className="text-primary-500 hover:text-primary-600 font-semibold px-1 py-0 min-h-0 h-auto"
                                    >
                                        Resend
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={handleBack}
                            >
                                <Icon icon={ChevronLeft} size={16} className="mr-1" />
                                Back
                            </Button>
                            <Button
                                variant="primary"
                                fullWidth
                                loading={isVerifying}
                                disabled={isVerifying || !otpComplete}
                                onClick={handleVerifyOtp}
                            >
                                <Icon icon={Check} size={16} className="mr-1" />
                                {isVerifying ? "Verifying…" : "Submit"}
                            </Button>
                        </div>

                        {/* Footer note */}
                        <p className="text-xs text-text-subtle text-center">
                            Code expires in{" "}
                            <span className="font-medium text-text-muted">10 minutes</span>
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

