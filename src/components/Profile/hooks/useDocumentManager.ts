import { useCallback, useState } from "react";
import type { Documents, DocumentType } from "@/types/db";
import {
    deleteUserDocument,
    listUserDocuments,
    uploadUserDocument,
} from "@/services/storage.service";
import { useDocumentOperations } from "../contexts/DocumentOperationsContext";

/**
 * Custom hook for managing document uploads and deletions
 * Centralizes document operations with proper error handling and loading states
 *
 * @example
 * const { uploadDocument, removeDocument, isUploading } = useDocumentManager({
 *   userId: user.id,
 *   documents: uploadedDocs,
 *   onDocumentsChange: setUploadedDocs,
 *   onSuccess: (msg) => setToast({ message: msg, type: "success" }),
 *   onError: (msg) => setToast({ message: msg, type: "error" }),
 * });
 */

interface UseDocumentManagerOptions {
    userId: string | null | undefined;
    documents: Documents;
    onDocumentsChange: (nextDocs: Documents) => void;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

interface DocumentOperation {
    type: DocumentType;
    inProgress: boolean;
}

export function useDocumentManager({
    userId,
    documents,
    onDocumentsChange,
    onSuccess,
    onError,
}: UseDocumentManagerOptions) {
    const [operations, setOperations] = useState<Map<DocumentType, DocumentOperation>>(new Map());
    const { startOperation, endOperation } = useDocumentOperations();

    const isOperationInProgress = useCallback(
        (docType: DocumentType) => operations.get(docType)?.inProgress ?? false,
        [operations]
    );

    const setOperationState = useCallback((docType: DocumentType, inProgress: boolean) => {
        setOperations((prev) => {
            const next = new Map(prev);
            next.set(docType, { type: docType, inProgress });
            return next;
        });
        if (inProgress) {
            startOperation(docType);
        } else {
            endOperation(docType);
        }
    }, [startOperation, endOperation]);

    const clearOperation = useCallback((docType: DocumentType) => {
        setOperations((prev) => {
            const next = new Map(prev);
            next.delete(docType);
            return next;
        });
        endOperation(docType);
    }, [endOperation]);

    const uploadDocument = useCallback(
        async (docType: DocumentType, file: File) => {
            if (!userId) {
                onError?.("User not authenticated");
                return;
            }

            setOperationState(docType, true);

            try {
                const result = await uploadUserDocument(file, userId, docType);

                const nextDocs: Documents = {
                    ...documents,
                    [docType]: {
                        url: result.url,
                        path: result.path,
                        uploadedAt: new Date().toISOString(),
                        filename: file.name,
                    },
                };

                onDocumentsChange(nextDocs);
                onSuccess?.(`${formatDocumentType(docType)} uploaded successfully!`);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                onError?.(`Failed to upload ${formatDocumentType(docType)}: ${message}`);
                console.error(`Upload error for ${docType}:`, error);
            } finally {
                clearOperation(docType);
            }
        },
        [userId, documents, onDocumentsChange, onSuccess, onError, setOperationState, clearOperation]
    );

    const removeDocument = useCallback(
        async (docType: DocumentType) => {
            if (!userId) {
                onError?.("User not authenticated");
                return;
            }

            setOperationState(docType, true);

            try {
                // List and delete all files of this document type
                const files = await listUserDocuments(userId, docType);

                if (files.length === 0) {
                    // No files to delete, just update state
                    const nextDocs = { ...documents };
                    delete (nextDocs as Record<string, unknown>)[docType];
                    onDocumentsChange(nextDocs);
                    return;
                }

                // Delete all versions
                await Promise.all(
                    files.map((file) => deleteUserDocument(userId, docType, file.name))
                );

                const nextDocs = { ...documents };
                delete (nextDocs as Record<string, unknown>)[docType];

                onDocumentsChange(nextDocs);
                onSuccess?.(`${formatDocumentType(docType)} removed successfully!`);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                onError?.(`Failed to remove ${formatDocumentType(docType)}: ${message}`);
                console.error(`Remove error for ${docType}:`, error);
            } finally {
                clearOperation(docType);
            }
        },
        [userId, documents, onDocumentsChange, onSuccess, onError, setOperationState, clearOperation]
    );

    const hasDocument = useCallback(
        (docType: DocumentType) => documents?.[docType] !== undefined,
        [documents]
    );

    const getDocument = useCallback(
        (docType: DocumentType) => documents?.[docType] ?? null,
        [documents]
    );

    const isAnyOperationInProgress = Array.from(operations.values()).some((op) => op.inProgress);

    return {
        uploadDocument,
        removeDocument,
        hasDocument,
        getDocument,
        isOperationInProgress,
        isAnyOperationInProgress,
        operations: Array.from(operations.values()),
    };
}

/**
 * Format document type for user-facing messages
 */
function formatDocumentType(docType: DocumentType): string {
    const labels: Record<DocumentType, string> = {
        passport: "Passport",
        visa: "Visa",
        drivingLicense: "Driving License",
        studentId: "Student ID",
        coe: "Confirmation of Enrollment",
        employmentLetter: "Employment Letter",
        payslips: "Payslips",
        bankStatement: "Bank Statement",
        proofOfFunds: "Proof of Funds",
        referenceLetter: "Reference Letter",
        guarantorLetter: "Guarantor Letter",
    };

    return labels[docType] || docType;
}

