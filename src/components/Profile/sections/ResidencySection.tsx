"use client";

import { Upload, SegmentedControl, Select } from "@/components/common";

interface ResidencySectionProps {
  isCitizen: boolean | null;
  visaStatus: string | null;
  uploadedDocs: string[];
  onCitizenChange: (isCitizen: boolean) => void;
  onVisaStatusChange: (visaStatus: string | null) => void;
  onUpload: (docType: string, file: File) => void;
  onRemove: (docType: string) => void;
}

export function ResidencySection({
  isCitizen,
  visaStatus,
  uploadedDocs,
  onCitizenChange,
  onVisaStatusChange,
  onUpload,
  onRemove,
}: ResidencySectionProps) {
  const hasPassport = uploadedDocs.includes("passport");
  const hasVisa = uploadedDocs.includes("visa");

  return (
    <div className="space-y-5">
      {/* Citizenship Status */}
      <SegmentedControl<boolean>
        ariaLabel="Citizenship status"
        value={isCitizen}
        onChange={(value) => {
          onCitizenChange(value);
          // If changing to citizen, clear visa status
          if (value) {
            onVisaStatusChange(null);
          }
        }}
        options={[
          { value: true, label: "Citizen", iconName: "user" },
          { value: false, label: "Resident", iconName: "users" },
        ]}
      />

      {/* Visa Type Selection - Only for non-citizens */}
      {isCitizen === false && (
        <Select
          label="Visa Type"
          value={visaStatus || ""}
          onChange={(e) => onVisaStatusChange(e.target.value || null)}
          options={[
            { value: "", label: "Select visa type" },
            { value: "student", label: "Student Visa" },
            { value: "work", label: "Work Visa" },
            { value: "working_holiday", label: "Working Holiday Visa" },
            { value: "temporary_graduate", label: "Temporary Graduate Visa" },
            { value: "partner", label: "Partner Visa" },
            { value: "permanent_resident", label: "Permanent Resident" },
            { value: "other", label: "Other" },
          ]}
        />
      )}

      {/* Doc uploads */}
      <div className="space-y-3">
        <Upload
          label="Passport"
          required
          helperText="Upload or drag a PDF/JPG/PNG of the photo page of your valid passport (max 2MB)."
          accept=".pdf,.jpg,.jpeg,.png"
          maxSizeMB={2}
          fieldName="passport"
          value={hasPassport ? new File([], "passport") : null}
          onChange={(file) => {
            if (file) onUpload("passport", file);
            else onRemove("passport");
          }}
        />

        {isCitizen === false && (
          <div className="space-y-2">
            <Upload
              label="Visa"
              required
              helperText="Upload or drag a PDF/JPG/PNG of your current valid visa (max 2MB)."
              accept=".pdf,.jpg,.jpeg,.png"
              maxSizeMB={2}
              fieldName="visa"
              value={hasVisa ? new File([], "visa") : null}
              onChange={(file) => {
                if (file) onUpload("visa", file);
                else onRemove("visa");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
