"use client";

import { Upload } from "./Upload";
import type { DocumentType } from "@/types/db";

/**
 * Specialized wrapper around Upload component for document uploads
 * Provides consistent UX and configuration for document handling
 *
 * @example
 * <DocumentUpload
 *   docType="passport"
 *   label="Passport"
 *   helperText="Upload your passport photo page"
 *   value={hasDocument("passport") ? getDocument("passport") : null}
 *   onUpload={(file) => uploadDocument("passport", file)}
 *   onRemove={() => removeDocument("passport")}
 *   isLoading={isOperationInProgress("passport")}
 * />
 */

interface DocumentUploadProps {
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

export function DocumentUpload({
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
}: DocumentUploadProps) {
    const handleChange = (file: File | null) => {
        if (file) {
            onUpload(file);
        } else {
            onRemove();
        }
    };

    // Create a File object for the Upload component if we have metadata
    const fileValue = value ? new File([], value.filename || docType) : null;

    return (
        <Upload
            label={label}
            helperText={isLoading ? "Processing..." : helperText}
            accept={accept}
            maxSizeMB={maxSizeMB}
            fieldName={docType}
            value={fileValue}
            onChange={handleChange}
            required={required}
            error={error}
            disabled={disabled || isLoading}
            allowDrop={!isLoading}
        />
    );
}

/**
 * Document upload configuration presets
 * Use these for consistent document upload configurations
 */
export const DocumentUploadPresets = {
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

