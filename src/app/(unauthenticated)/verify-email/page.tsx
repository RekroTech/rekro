"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/common/Icon";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

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
        if (errorCode === "link_expired" || errorDescription?.includes("expired")) {
            return {
                title: "Link expired",
                message: "This magic link has expired. Links are valid for 1 hour.",
                icon: "info" as const,
            };
        }

        if (errorCode === "invalid_link" || error === "invalid_link") {
            return {
                title: "Invalid link",
                message: "This link is invalid or has already been used.",
                icon: "x" as const,
            };
        }

        if (error === "email_verification_failed") {
            return {
                title: "Verification failed",
                message: "We couldn't verify your email. The link may have expired or is invalid.",
                icon: "x" as const,
            };
        }

        return {
            title: "Something went wrong",
            message: errorDescription || "An error occurred during authentication.",
            icon: "x" as const,
        };
    };

    const errorInfo = error || errorCode ? getErrorMessage() : null;

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

                    {/* Error State */}
                    {errorInfo && (
                        <>
                            <div className="mb-6 flex justify-center">
                                <div className="h-20 w-20 rounded-full bg-danger-500/10 flex items-center justify-center">
                                    <Icon name={errorInfo.icon} className="h-10 w-10 text-danger-500" />
                                </div>
                            </div>
                            <h1 className="text-center text-2xl font-bold text-foreground mb-3">
                                {errorInfo.title}
                            </h1>
                            <p className="text-center text-text-muted mb-6">
                                {errorInfo.message}
                            </p>

                            <div className="space-y-3">
                                <Link
                                    href="/?auth=open"
                                    className="block w-full rounded-[10px] bg-primary-500 py-3.5 text-center text-[17px] font-semibold text-white shadow-[0_4px_10px_rgba(58,127,121,0.30)] transition hover:bg-primary-600 dark:bg-primary-300 dark:text-[#071010] dark:hover:bg-primary-200"
                                >
                                    Request a new link
                                </Link>

                                <Link
                                    href="/"
                                    className="block w-full text-center text-sm text-primary-600 hover:opacity-80 dark:text-primary-300 py-2"
                                >
                                    Go to home page
                                </Link>
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

