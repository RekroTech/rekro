"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Modal, Icon } from "@/components/common";

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentUrl: string;
    documentName: string;
    documentType?: string;
}

const isHttpUrl = (value: string) => {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
};

const getPathnameForTypeDetection = (rawUrl: string) => {
    try {
        const u = new URL(rawUrl);
        return (u.pathname || "").toLowerCase();
    } catch {
        // Fall back to raw string checks if URL parsing fails
        return (rawUrl || "").toLowerCase();
    }
};

export function DocumentPreviewModal({
    isOpen,
    onClose,
    documentUrl,
    documentName,
    documentType,
}: DocumentPreviewModalProps) {
    const pathname = useMemo(() => getPathnameForTypeDetection(documentUrl), [documentUrl]);
    const urlLower = (documentUrl || "").toLowerCase();

    // Determine file type (prefer pathname so signed URLs / querystrings don't break detection)
    const previewType: "image" | "pdf" | "unsupported" =
        pathname.endsWith(".pdf") || urlLower.includes("application/pdf")
            ? "pdf"
            : pathname.endsWith(".jpg") ||
                pathname.endsWith(".jpeg") ||
                pathname.endsWith(".png") ||
                pathname.endsWith(".gif") ||
                pathname.endsWith(".webp") ||
                urlLower.includes("image/")
              ? "image"
              : "unsupported";

    const isValidPreviewUrl = isHttpUrl(documentUrl);

    // Only show loading for supported types and valid URLs
    const shouldInitiallyLoad =
        isValidPreviewUrl && (previewType === "pdf" || previewType === "image");

    const [isLoading, setIsLoading] = useState(shouldInitiallyLoad);
    const [error, setError] = useState<string | null>(null);

    // When a new document is selected, remount the preview node so internal loading/error state is naturally reset.
    const previewKey = `${previewType}:${documentUrl}`;

    const loadTimeoutRef = useRef<number | null>(null);

    // Reset loading state when modal opens with a new document
    useEffect(() => {
        // Clear any previous timers
        if (loadTimeoutRef.current) {
            window.clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }

        if (!isOpen) return;

        // Basic URL guardrail
        if (!documentUrl || !isValidPreviewUrl) {
            setIsLoading(false);
            setError(documentUrl ? "Invalid document URL" : "No document URL provided");
            return;
        }

        if (previewType === "unsupported") {
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        // PDFs in iframes can fail to trigger onLoad when blocked by X-Frame-Options/CSP,
        // but they may still render. Just clear the loading state after a reasonable timeout.
        if (previewType === "pdf") {
            loadTimeoutRef.current = window.setTimeout(() => {
                setIsLoading(false);
                // Don't set error - the PDF may be rendering even without onLoad event
            }, 2000);
        }

        if (previewType === "image") {
            loadTimeoutRef.current = window.setTimeout(() => {
                setIsLoading(false);
                // Don't set error - the image may be rendering even without onLoad event
            }, 3000);
        }

        return () => {
            if (loadTimeoutRef.current) {
                window.clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewKey, isOpen]);

    const handleDownload = () => {
        window.open(documentUrl, "_blank");
    };

    const clearLoadTimeout = () => {
        if (loadTimeoutRef.current) {
            window.clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }
    };

    const renderPreview = () => {
        if (isLoading && previewType !== "unsupported") {
            return (
                <div className="flex items-center justify-center h-[500px]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="text-sm text-text-muted">Loading document...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center h-[500px]">
                    <div className="flex flex-col items-center gap-3">
                        <Icon name="alert-circle" className="w-12 h-12 text-red-500" />
                        <p className="text-sm text-text text-center max-w-md">{error}</p>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                            Open in New Tab
                        </button>
                    </div>
                </div>
            );
        }

        switch (previewType) {
            case "image": {
                return (
                    <div
                        key={previewKey}
                        className="relative flex items-center justify-center bg-surface-subtle rounded-lg overflow-hidden h-[70vh]"
                    >
                        <Image
                            src={documentUrl}
                            alt={documentName}
                            fill
                            className="object-contain"
                            sizes="(max-width: 1200px) 100vw, 1200px"
                            unoptimized
                            onLoad={() => {
                                clearLoadTimeout();
                                setIsLoading(false);
                            }}
                            onError={() => {
                                clearLoadTimeout();
                                setIsLoading(false);
                                setError("Failed to load image. Please open it in a new tab.");
                            }}
                        />
                    </div>
                );
            }

            case "pdf":
                return (
                    <div
                        key={previewKey}
                        className="w-full h-[70vh] bg-surface-subtle rounded-lg overflow-hidden"
                    >
                        <iframe
                            src={`${documentUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                            className="w-full h-full"
                            title={documentName}
                            onError={() => {
                                clearLoadTimeout();
                                setIsLoading(false);
                                setError("This PDF couldn't be previewed here. Please open it in a new tab.");
                            }}
                        />
                    </div>
                );

            case "unsupported":
                return (
                    <div className="flex items-center justify-center h-[500px]">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <Icon name="file" className="w-12 h-12 text-text-muted" />
                            <p className="text-sm text-text font-medium">Preview not available</p>
                            <p className="text-xs text-text-muted max-w-md">
                                This file type cannot be previewed in the browser. Click the button
                                below to download or open it.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Icon name="download" className="w-4 h-4" />
                                Open Document
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={documentName}
            size="xl"
            primaryButton={{
                label: "Download",
                onClick: handleDownload,
                variant: "primary",
            }}
            secondaryButton={{
                label: "Close",
                onClick: onClose,
                variant: "secondary",
            }}
        >
            <div className="space-y-4">
                {/* Document info */}
                <div className="flex items-center gap-3 p-3 bg-surface-subtle rounded-lg border border-border">
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-700/50 flex items-center justify-center">
                        <Icon
                            name="file"
                            className="w-5 h-5 text-primary-600 dark:text-primary-400"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{documentName}</p>
                        {documentType && (
                            <p className="text-xs text-text-muted capitalize">
                                {documentType.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        <span className="px-2 py-1 bg-surface-muted rounded-md text-xs font-medium text-text-muted capitalize">
                            {previewType === "unsupported" ? "Unknown" : previewType}
                        </span>
                    </div>
                </div>

                {/* Preview area */}
                {renderPreview()}
            </div>
        </Modal>
    );
}
