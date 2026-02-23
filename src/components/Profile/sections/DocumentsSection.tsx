"use client";

import { Upload, UploadPresets } from "@/components/common";
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
  const {
    uploadDocument,
    removeDocument,
    getDocument,
    isOperationInProgress,
  } = useDocumentManager({
    userId,
    documents: uploadedDocs,
    onDocumentsChange: onChange,
  });

  return (
    <div className="space-y-4">
      <Upload
        docType="drivingLicense"
        {...UploadPresets.drivingLicense}
        value={getDocument("drivingLicense")}
        onUpload={(file) => uploadDocument("drivingLicense", file)}
        onRemove={() => removeDocument("drivingLicense")}
        isLoading={isOperationInProgress("drivingLicense")}
      />

      <Upload
        docType="referenceLetter"
        {...UploadPresets.referenceLetter}
        value={getDocument("referenceLetter")}
        onUpload={(file) => uploadDocument("referenceLetter", file)}
        onRemove={() => removeDocument("referenceLetter")}
        isLoading={isOperationInProgress("referenceLetter")}
      />

      <Upload
        docType="guarantorLetter"
        {...UploadPresets.guarantorLetter}
        value={getDocument("guarantorLetter")}
        onUpload={(file) => uploadDocument("guarantorLetter", file)}
        onRemove={() => removeDocument("guarantorLetter")}
        isLoading={isOperationInProgress("guarantorLetter")}
      />
    </div>
  );
}
