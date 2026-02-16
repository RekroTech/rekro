"use client";

import { Upload } from "@/components/common";

interface DocumentsSectionProps {
  uploadedDocs: string[];
  onUpload: (docType: string, file: File) => void;
  onRemove: (docType: string) => void;
}

export function DocumentsSection({
  uploadedDocs,
  onUpload,
  onRemove,
}: DocumentsSectionProps) {
  const hasDrivingLicense = uploadedDocs.includes("drivingLicense");
  const hasReferenceLetter = uploadedDocs.includes("referenceLetter");
  const hasGuarantorLetter = uploadedDocs.includes("guarantorLetter");

  return (
    <div className="space-y-4">
      <Upload
        label="Driver Licence"
        helperText="Upload or drag a PDF/JPG/PNG image of your driver licence (max 2MB)."
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeMB={2}
        fieldName="drivingLicense"
        value={hasDrivingLicense ? new File([], "drivingLicense") : null}
        onChange={(file) => {
          if (file) onUpload("drivingLicense", file);
          else onRemove("drivingLicense");
        }}
      />

      <Upload
        label="Reference Letter"
        helperText="Upload or drag a PDF/JPG/PNG reference letter (max 2MB)."
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeMB={2}
        fieldName="referenceLetter"
        value={hasReferenceLetter ? new File([], "referenceLetter") : null}
        onChange={(file) => {
          if (file) onUpload("referenceLetter", file);
          else onRemove("referenceLetter");
        }}
      />

      <Upload
        label="Guarantor Letter"
        helperText="Upload or drag a PDF/JPG/PNG guarantor letter (max 2MB)."
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeMB={2}
        fieldName="guarantorLetter"
        value={hasGuarantorLetter ? new File([], "guarantorLetter") : null}
        onChange={(file) => {
          if (file) onUpload("guarantorLetter", file);
          else onRemove("guarantorLetter");
        }}
      />
    </div>
  );
}
