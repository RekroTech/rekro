"use client";

import { DocumentUpload, DocumentUploadPresets } from "@/components/common/DocumentUpload";
import { useToast } from "@/hooks/useToast";
import type { Documents } from "@/types/db";
import { useDocumentManager } from "../hooks";

interface DocumentsSectionProps {
  userId: string;
  uploadedDocs: Documents;
  onChange: (docs: Documents) => void;
}

/**
 * Additional Documents Section
 * Handles driver license, reference letter, and guarantor letter uploads
 * Uses DocumentUpload component and useDocumentManager hook for consistent behavior
 */
export function DocumentsSection({
  userId,
  uploadedDocs,
  onChange,
}: DocumentsSectionProps) {
  const { showSuccess, showError } = useToast();

  const {
    uploadDocument,
    removeDocument,
    getDocument,
    isOperationInProgress,
  } = useDocumentManager({
    userId,
    documents: uploadedDocs,
    onDocumentsChange: onChange,
    onSuccess: showSuccess,
    onError: showError,
  });

  return (
    <div className="space-y-4">
      <DocumentUpload
        docType="drivingLicense"
        {...DocumentUploadPresets.drivingLicense}
        value={getDocument("drivingLicense")}
        onUpload={(file) => uploadDocument("drivingLicense", file)}
        onRemove={() => removeDocument("drivingLicense")}
        isLoading={isOperationInProgress("drivingLicense")}
      />

      <DocumentUpload
        docType="referenceLetter"
        {...DocumentUploadPresets.referenceLetter}
        value={getDocument("referenceLetter")}
        onUpload={(file) => uploadDocument("referenceLetter", file)}
        onRemove={() => removeDocument("referenceLetter")}
        isLoading={isOperationInProgress("referenceLetter")}
      />

      <DocumentUpload
        docType="guarantorLetter"
        {...DocumentUploadPresets.guarantorLetter}
        value={getDocument("guarantorLetter")}
        onUpload={(file) => uploadDocument("guarantorLetter", file)}
        onRemove={() => removeDocument("guarantorLetter")}
        isLoading={isOperationInProgress("guarantorLetter")}
      />
    </div>
  );
}
