"use client";

import React, { useRef, useState } from "react";
import { clsx } from "clsx";
import { Icon } from "./Icon";
import { Button } from "./Button";
import type { DocumentType } from "@/types/db";

/**
 * Props for document upload component
 */
export interface UploadProps {
    /** Document type (used for internal tracking) */
    docType: DocumentType;

    /** Display label */
    label: string;

    /** Helper text shown below the upload field */
    helperText?: string;

    /** Current document metadata (if exists) */
    value: { filename: string; url?: string } | null;

    /** Callback when a file is uploaded */
    onUpload: (file: File) => void | Promise<void>;

    /** Callback when the document is removed */
    onRemove: () => void | Promise<void>;

    /** Whether an upload/remove operation is in progress */
    isLoading?: boolean;

    /** Whether this field is required */
    required?: boolean;

    /** Accepted file types */
    accept?: string;

    /** Maximum file size in MB */
    maxSizeMB?: number;

    /** Error message to display */
    error?: string;

    /** Whether the field is disabled */
    disabled?: boolean;
}


export function Upload({
    docType,
    label,
    helperText = "Upload or drag a PDF/JPG/PNG file (max 2MB)",
    value,
    onUpload,
    onRemove,
    isLoading = false,
    required = false,
    accept = ".pdf,.jpg,.jpeg,.png",
    maxSizeMB = 2,
    error,
    disabled = false,
}: UploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);

    const inputId = `file-upload-${docType}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const handleChange = (file: File | null) => {
        if (file) {
            onUpload(file);
        } else {
            onRemove();
        }
    };

    const handleFiles = (fileList: FileList | null) => {
        const file = fileList?.[0] ?? null;
        if (!file) return;

        // Clear any previous internal errors
        setInternalError(null);

        // Validate file type if accept is specified and not "*"
        if (accept !== "*") {
            const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
            const fileExt = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
            const fileMimeType = file.type.toLowerCase();

            const isValidType = acceptedTypes.some((acceptType) => {
                // Handle file extensions (e.g., ".pdf", ".jpg")
                if (acceptType.startsWith(".")) {
                    return fileExt === acceptType;
                }
                // Handle MIME types (e.g., "image/*", "application/pdf")
                if (acceptType.includes("*")) {
                    const mimePrefix = acceptType.split("/")[0];
                    return fileMimeType.startsWith(mimePrefix + "/");
                }
                return fileMimeType === acceptType;
            });

            if (!isValidType) {
                const errorMessage = `Invalid file type. Please upload a file matching: ${accept}`;
                setInternalError(errorMessage);
                console.warn("File upload error:", errorMessage);
                return;
            }
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const errorMessage = `File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB`;
            setInternalError(errorMessage);
            console.warn("File upload error:", errorMessage);
            return;
        }

        handleChange(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (inputRef.current) {
            // Allows selecting the same file again.
            inputRef.current.value = "";
        }
    };

    const openPicker = () => {
        if (disabled || isLoading) return;
        inputRef.current?.click();
    };

    const handleDrag = (e: React.DragEvent) => {
        if (disabled || isLoading) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (disabled || isLoading) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = () => {
        if (disabled || isLoading) return;
        setInternalError(null);
        handleChange(null);
    };

    // Create a File object if we have metadata
    const fileValue = value ? new File([], value.filename || docType) : null;
    const hasFile = Boolean(fileValue);

    // Use external error if provided, otherwise use internal error
    const displayError = error || internalError;

    const labelNode = (
        <div className="flex items-center gap-2 min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-foreground truncate">
                {label}
            </span>
            {required && <span className="text-danger-500">*</span>}
        </div>
    );

    const descriptionText = isLoading ? "Processing..." : helperText;

    const containerClasses = clsx(
        "flex items-center justify-between gap-4 border px-4 py-3 bg-card transition-all",
        "rounded-lg",
        disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-text-muted",
        "border-border focus-within:ring-2 focus-within:ring-primary-500",
        dragActive && !displayError && !disabled && !isLoading && "border-primary-500 bg-primary-50"
    );

    const describedBy = displayError ? errorId : descriptionText ? helperId : undefined;

    return (
        <div className="min-w-0">
            <div
                className={containerClasses}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <div className="min-w-0 flex-1">
                    {labelNode}
                    <p className="mt-1 text-xs text-text-muted truncate" id={helperId}>
                        {descriptionText}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                        ref={inputRef}
                        id={inputId}
                        type="file"
                        onChange={handleInputChange}
                        className="hidden"
                        accept={accept}
                        disabled={disabled || isLoading}
                        aria-invalid={displayError ? "true" : "false"}
                        aria-required={required ? "true" : "false"}
                        aria-describedby={describedBy}
                    />

                    {!hasFile ? (
                        <Button
                            type="button"
                            onClick={openPicker}
                            variant="outline"
                            size="sm"
                            disabled={disabled || isLoading}
                            className="min-h-[40px]"
                            title={helperText || undefined}
                        >
                            Upload
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 max-w-[260px]">
                            <button
                                type="button"
                                onClick={openPicker}
                                className={clsx(
                                    "text-sm text-foreground truncate underline-offset-2",
                                    disabled || isLoading
                                        ? "cursor-not-allowed"
                                        : "hover:underline focus-visible:underline"
                                )}
                                title={fileValue?.name || undefined}
                                disabled={disabled || isLoading}
                            >
                                {fileValue?.name}
                            </button>
                            <button
                                type="button"
                                onClick={removeFile}
                                className={clsx(
                                    "p-1.5 rounded-md transition-colors outline-none",
                                    "text-text-muted hover:text-danger-600 hover:bg-danger-500/10",
                                    "focus:shadow-[0_0_0_4px_var(--focus-ring)]",
                                    (disabled || isLoading) && "cursor-not-allowed"
                                )}
                                aria-label="Remove file"
                                disabled={disabled || isLoading}
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {dragActive && !disabled && !isLoading && (
                <p className="mt-2 text-xs text-text-muted">Drop the file to upload</p>
            )}

            {displayError && (
                <p id={errorId} className="mt-1.5 text-sm text-danger-500" role="alert">
                    {displayError}
                </p>
            )}
        </div>
    );
}

/**
 * Document upload configuration presets
 * Use these for consistent document upload configurations
 */
export const UploadPresets = {
    passport: {
        label: "Passport",
        helperText: "Upload or drag a PDF/JPG/PNG of the photo page of your valid passport (max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    visa: {
        label: "Visa",
        helperText: "Upload or drag a PDF/JPG/PNG of your current valid visa (max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
        required: true,
    },
    drivingLicense: {
        label: "Driver Licence",
        helperText: "Upload or drag a PDF/JPG/PNG image of your driver licence (max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    studentId: {
        label: "Student ID",
        helperText: "Upload your current student ID card (PDF/JPG/PNG, max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    coe: {
        label: "Confirmation of Enrollment (CoE)",
        helperText: "Upload your current semester CoE (PDF/JPG/PNG, max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    employmentLetter: {
        label: "Employment Letter",
        helperText: "Upload your employment letter (PDF/JPG/PNG, max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    payslips: {
        label: "Payslips",
        helperText: "Upload your last 3 months of payslips (PDF/JPG/PNG, max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    bankStatement: {
        label: "Bank Statements",
        helperText: "Upload your last 3 months of bank statements (PDF/JPG/PNG, max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    proofOfFunds: {
        label: "Proof of Financial Support",
        helperText: "Bank statements, scholarship letters, or sponsor documents (PDF/JPG/PNG, max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    referenceLetter: {
        label: "Reference Letter",
        helperText: "Upload or drag a PDF/JPG/PNG reference letter (max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
    guarantorLetter: {
        label: "Guarantor Letter",
        helperText: "Upload or drag a PDF/JPG/PNG guarantor letter (max 2MB).",
        accept: ".pdf,.jpg,.jpeg,.png",
        maxSizeMB: 2,
    },
} as const;

