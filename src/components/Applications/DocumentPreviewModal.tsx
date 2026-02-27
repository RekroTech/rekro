"use client";

import { useState } from "react";
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

export function DocumentPreviewModal({
    isOpen,
    onClose,
    documentUrl,
    documentName,
    documentType,
}: DocumentPreviewModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const url = documentUrl?.toLowerCase() ?? "";
    const previewType: "image" | "pdf" | "unsupported" =
        url.includes(".pdf") || url.includes("application/pdf")
            ? "pdf"
            : url.includes(".jpg") ||
                url.includes(".jpeg") ||
                url.includes(".png") ||
                url.includes(".gif") ||
                url.includes(".webp") ||
                url.includes("image/")
              ? "image"
              : "unsupported";

    // When a new document is selected, remount the preview node so internal loading/error state is naturally reset.
    const previewKey = `${previewType}:${documentUrl}`;

    const handleDownload = () => {
        window.open(documentUrl, "_blank");
    };

    const renderPreview = () => {
        if (isLoading) {
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
                        <p className="text-sm text-text">{error}</p>
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
                if (!isHttpUrl(documentUrl)) {
                    return (
                        <div className="flex items-center justify-center h-[500px]">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <Icon name="alert-circle" className="w-12 h-12 text-red-500" />
                                <p className="text-sm text-text">Invalid document URL</p>
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

                return (
                    <div
                        key={previewKey}
                        className="relative flex items-center justify-center bg-surface-subtle rounded-lg overflow-hidden h-[70vh]"
                    >
                        <Image
                            src={documentUrl}
                            alt={documentName}
                            fill
                            sizes="(max-width: 768px) 100vw, 80vw"
                            className="object-contain"
                            unoptimized
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setError("Failed to load image");
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
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setIsLoading(false);
                                setError("Failed to load PDF");
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
