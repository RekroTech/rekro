"use client";

import React, { useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { Icon } from "./Icon";
import { Button } from "./Button";

export interface FileUploadProps {
    /** Label to display (optional in `labelPlacement="none"` use-cases). */
    label: string;
    accept?: string;
    maxSizeMB?: number;
    onChange: (file: File | null) => void;
    value?: File | null;
    error?: string;
    helperText?: string;
    required?: boolean;
    fieldName?: string;
    disabled?: boolean;

    /** Where to render the label (if provided). Useful for embedding next to a parent label. */
    labelPlacement?: "top" | "left" | "none";

    /** Optional override for button text. */
    buttonText?: string | ((hasFile: boolean) => string);

    /** If true, enable drag-and-drop onto the button/card. */
    allowDrop?: boolean;
}

export function Upload({
    label,
    accept = "*",
    maxSizeMB = 10,
    onChange,
    value = null,
    error,
    helperText,
    required = false,
    fieldName,
    disabled = false,
    labelPlacement = "top",
    buttonText,
    allowDrop = true,
}: FileUploadProps) {
    const reactId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);

    const inputId = fieldName ? `file-upload-${fieldName}` : `file-upload-${reactId}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const resolveButtonText = (hasFile: boolean) => {
        if (typeof buttonText === "function") return buttonText(hasFile);
        if (typeof buttonText === "string") return buttonText;
        return hasFile ? "Replace" : "Upload";
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

        onChange(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (inputRef.current) {
            // Allows selecting the same file again.
            inputRef.current.value = "";
        }
    };

    const openPicker = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    const handleDrag = (e: React.DragEvent) => {
        if (!allowDrop || disabled) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!allowDrop || disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = () => {
        if (disabled) return;
        setInternalError(null);
        onChange(null);
    };

    const hasFile = Boolean(value);

    // Use external error if provided, otherwise use internal error
    const displayError = error || internalError;

    const labelNode = label ? (
        <div className="flex items-center gap-2 min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-foreground truncate">
                {label}
            </span>
            {required && <span className="text-danger-500">*</span>}
        </div>
    ) : null;

    const descriptionText = helperText || `Upload or drag a file • up to ${maxSizeMB}MB`;

    const dropHandlers = allowDrop
        ? {
              onDragEnter: handleDrag,
              onDragLeave: handleDrag,
              onDragOver: handleDrag,
              onDrop: handleDrop,
          }
        : {};

    const containerClasses = clsx(
        "flex items-center justify-between gap-4 border px-4 py-3 bg-card transition-all",
        "rounded-lg", // match Input/Button radius
        disabled ? "opacity-50 cursor-not-allowed" : "hover:border-text-muted",
        "border-border focus-within:ring-2 focus-within:ring-primary-500",
        dragActive && !displayError && !disabled && "border-primary-500 bg-primary-50"
    );

    const describedBy = displayError ? errorId : descriptionText ? helperId : undefined;

    return (
        <div className={clsx(labelPlacement === "left" && "flex items-start gap-4")}>
            {labelPlacement === "left" && (
                <div className="pt-1 min-w-0">
                    {labelNode}
                    <p className="mt-1 text-xs text-text-muted truncate">{descriptionText}</p>
                </div>
            )}

            <div className={clsx("min-w-0", labelPlacement === "left" ? "flex-1" : undefined)}>
                <div className={containerClasses} {...dropHandlers}>
                    <div className="min-w-0 flex-1">
                        {labelPlacement === "top" && labelNode}
                        {labelPlacement === "top" && (
                            <p className="mt-1 text-xs text-text-muted truncate" id={helperId}>
                                {descriptionText}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                            ref={inputRef}
                            id={inputId}
                            type="file"
                            onChange={handleChange}
                            className="hidden"
                            accept={accept}
                            disabled={disabled}
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
                                disabled={disabled}
                                className="min-h-[40px]"
                                title={helperText || undefined}
                            >
                                {resolveButtonText(false)}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 max-w-[260px]">
                                <button
                                    type="button"
                                    onClick={openPicker}
                                    className={clsx(
                                        "text-sm text-foreground truncate underline-offset-2",
                                        disabled
                                            ? "cursor-not-allowed"
                                            : "hover:underline focus-visible:underline"
                                    )}
                                    title={value?.name || undefined}
                                    disabled={disabled}
                                >
                                    {value?.name}
                                </button>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className={clsx(
                                        "p-1.5 rounded-md transition-colors outline-none",
                                        "text-text-muted hover:text-danger-600 hover:bg-danger-500/10",
                                        "focus:shadow-[0_0_0_4px_var(--focus-ring)]",
                                        disabled && "cursor-not-allowed"
                                    )}
                                    aria-label="Remove file"
                                    disabled={disabled}
                                >
                                    <Icon name="x" className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {dragActive && allowDrop && !disabled && (
                    <p className="mt-2 text-xs text-text-muted">Drop the file to upload</p>
                )}

                {labelPlacement === "none" && (
                    <p className="mt-1 text-xs text-text-muted" id={helperId}>
                        {descriptionText}
                    </p>
                )}

                {displayError && (
                    <p id={errorId} className="mt-1.5 text-sm text-danger-500" role="alert">
                        {displayError}
                    </p>
                )}
            </div>
        </div>
    );
}
