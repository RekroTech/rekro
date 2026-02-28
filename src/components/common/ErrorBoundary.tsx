"use client";

import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "./Button";
import { Icon } from "./Icon";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                        <Icon name="alert-circle" className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-text-muted">
                            We&#39;re sorry for the inconvenience
                        </p>
                    </div>
                </div>

                <details className="mb-4">
                    <summary className="cursor-pointer text-sm text-text-muted hover:text-foreground mb-2">
                        Error details
                    </summary>
                    <pre className="text-xs bg-surface-subtle p-3 rounded overflow-auto max-h-40 border border-border">
                        {error instanceof Error ? error.message : String(error)}
                    </pre>
                </details>

                <div className="flex gap-2">
                    <Button onClick={resetErrorBoundary} fullWidth>
                        Try again
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => (window.location.href = "/")}
                        fullWidth
                    >
                        Go home
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, errorInfo) => {
                // Log to console in development
                console.error("Error caught by boundary:", error, errorInfo);

                // TODO: Add Sentry error tracking here
                // Sentry.captureException(error, {
                //     contexts: { react: errorInfo }
                // });
            }}
            onReset={() => {
                // Optional: Clear any error state
                // queryClient.clear();
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}

