"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/common/Icon";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [resendEmail, setResendEmail] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [resendError, setResendError] = useState<string | null>(null);

    // Get error params from URL
    const error = useMemo(() => searchParams.get("error"), [searchParams]);
    const errorCode = useMemo(() => searchParams.get("error_code"), [searchParams]);
    const errorDescription = useMemo(() => searchParams.get("error_description"), [searchParams]);
    const verified = useMemo(() => searchParams.get("verified") === "true", [searchParams]);

    // If verified successfully, redirect after a short delay
    useEffect(() => {
        if (verified) {
            const timer = setTimeout(() => {
                router.replace("/dashboard");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [verified, router]);

    const getErrorMessage = () => {
        if (errorCode === "link_expired" || errorDescription?.toLowerCase().includes("expired")) {
            return {
                title: "Link expired",
                message: "This sign-in link has expired. Links are valid for 1 hour.",
                icon: "info" as const,
                canResend: true,
            };
        }

        if (errorCode === "invalid_link" || error === "invalid_link") {
            return {
                title: "Invalid link",
                message: "This link is invalid or has already been used.",
                icon: "x" as const,
                canResend: true,
            };
        }

        if (error === "email_verification_failed") {
            return {
                title: "Verification failed",
                message: "We couldn't verify your email. The link may have expired or is invalid.",
                icon: "x" as const,
                canResend: true,
            };
        }

        return {
            title: "Something went wrong",
            message: errorDescription || "An error occurred during authentication.",
            icon: "x" as const,
            canResend: false,
        };
    };

    const errorInfo = error || errorCode ? getErrorMessage() : null;
    const isErrorModalOpen = !!errorInfo;

    const handleCloseErrorModal = () => {
        // Go home and clear query params
        router.replace("/");
    };

    const handleTryDifferentEmail = () => {
        router.replace("/?auth=open");
    };

    const handleResend = async () => {
        const email = resendEmail.trim().toLowerCase();
        setResendMessage(null);
        setResendError(null);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setResendError("Enter the email address you used, then we’ll send a new link.");
            return;
        }

        try {
            setIsResending(true);
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const body = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;

            if (!res.ok) {
                setResendError(body?.error || "Failed to resend verification email. Please try again.");
                return;
            }

            setResendMessage(body?.message || "Verification email sent. Please check your inbox.");
        } catch {
            setResendError("Failed to resend verification email. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="auth-theme flex min-h-screen items-center justify-center bg-app-bg px-5 py-10 text-foreground">
            <div className="w-full max-w-md">
                <div className="card border border-input-border px-6 py-8">
                    {/* Success State */}
                    {verified && (
                        <>
                            <div className="mb-6 flex justify-center">
                                <div className="h-20 w-20 rounded-full bg-success-500/10 flex items-center justify-center">
                                    <Icon name="check" className="h-10 w-10 text-success-500" />
                                </div>
                            </div>
                            <h1 className="text-center text-2xl font-bold text-foreground mb-3">
                                Email verified!
                            </h1>
                            <p className="text-center text-text-muted mb-6">
                                Your email has been verified successfully. Redirecting you to your dashboard...
                            </p>
                            <div className="flex justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                            </div>
                        </>
                    )}

                    {/* Default state - shouldn't normally be seen */}
                    {!verified && !errorInfo && (
                        <>
                            <div className="mb-6 flex justify-center">
                                <div className="h-20 w-20 rounded-full bg-primary-500/10 flex items-center justify-center">
                                    <Icon name="mail" className="h-10 w-10 text-primary-500" />
                                </div>
                            </div>
                            <h1 className="text-center text-2xl font-bold text-foreground mb-3">
                                Verifying...
                            </h1>
                            <div className="flex justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                            </div>
                        </>
                    )}
                </div>

                <p className="mt-6 text-center text-sm text-text-subtle">
                    Need help? Contact{" "}
                    <a
                        href="mailto:admin@rekro.com.au"
                        className="text-primary-600 hover:opacity-80 dark:text-primary-300"
                    >
                        admin@rekro.com.au
                    </a>
                </p>
            </div>

            {/* Error modal */}
            <Modal
                isOpen={isErrorModalOpen}
                onClose={handleCloseErrorModal}
                title={errorInfo?.title}
                size="sm"
                primaryButton={{
                    label: "Try a different email",
                    onClick: handleTryDifferentEmail,
                    variant: "primary",
                }}
                secondaryButton={{
                    label: "Go to home",
                    onClick: handleCloseErrorModal,
                    variant: "secondary",
                }}
                actionsDescription="If you requested a link to the wrong address, try signing in again."
            >
                {errorInfo && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-danger-500/10 flex items-center justify-center flex-shrink-0">
                                <Icon name={errorInfo.icon} className="h-5 w-5 text-danger-500" />
                            </div>
                            <div>
                                <p className="text-sm text-text-muted">{errorInfo.message}</p>
                            </div>
                        </div>

                        {errorInfo.canResend && (
                            <div className="rounded-[10px] border border-input-border bg-card p-4">
                                <p className="text-sm font-semibold text-foreground mb-2">Resend a new link</p>
                                <p className="text-xs text-text-muted mb-3">
                                    Enter the email you used and we’ll send you a fresh sign-in link.
                                </p>

                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        value={resendEmail}
                                        onChange={(e) => setResendEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="input"
                                        autoComplete="email"
                                        disabled={isResending}
                                    />

                                    {resendError && (
                                        <div className="rounded-[10px] border border-danger-500/30 bg-danger-500/10 p-3">
                                            <p className="text-sm text-danger-600 dark:text-danger-500">
                                                {resendError}
                                            </p>
                                        </div>
                                    )}

                                    {resendMessage && (
                                        <div className="rounded-[10px] border border-primary-500/30 bg-primary-500/10 p-3">
                                            <p className="text-sm text-primary-600 dark:text-primary-300">
                                                {resendMessage}
                                            </p>
                                        </div>
                                    )}

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

                                    <div className="text-xs text-text-subtle">
                                        Still stuck?{" "}
                                        <Link href="/?auth=open" className="text-primary-600 hover:opacity-80 dark:text-primary-300">
                                            Request a new magic link
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default function VerifyEmailPage() {
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
            <VerifyEmailContent />
        </Suspense>
    );
}
