"use client";

import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "@/components/common";
import { useRouter } from "next/navigation";
import React from "react";

function PropertyErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const router = useRouter();

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto text-center bg-card border border-border rounded-lg p-6">
                <div className="mb-4">
                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Failed to load property
                    </h2>
                    <p className="text-sm text-text-muted mb-4">
                        {error instanceof Error ? error.message : "An unexpected error occurred"}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button onClick={resetErrorBoundary} fullWidth>
                        Try again
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/")} fullWidth>
                        Back to listings
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface PropertyErrorBoundaryProps {
    children: React.ReactNode;
}

export function PropertyErrorBoundary({ children }: PropertyErrorBoundaryProps) {
    return (
        <ReactErrorBoundary
            FallbackComponent={PropertyErrorFallback}
            onError={(error, errorInfo) => {
                console.error("Property page error:", error, errorInfo);
                // TODO: Track with Sentry
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}

