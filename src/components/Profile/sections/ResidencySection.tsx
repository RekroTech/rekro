"use client";

import { Upload, UploadPresets, SegmentedControl, Select } from "@/components/common";
import { VISA_TYPE_OPTIONS } from "@/components/Profile";
import type { ResidencyFormState } from "../types";
import { useDocumentManager } from "../hooks";

interface ResidencySectionProps {
    userId: string;
    data: ResidencyFormState;
    onChange: (data: Partial<ResidencyFormState>) => void;
}

/**
 * Residency Section
 * Handles citizenship status, visa type selection, and document uploads
 * Uses DocumentUpload component and useDocumentManager hook for consistent behavior
 */
export function ResidencySection({ userId, data, onChange }: ResidencySectionProps) {

    const { uploadDocument, removeDocument, getDocument, isOperationInProgress } =
        useDocumentManager({
            userId,
            documents: data.documents || {},
            onDocumentsChange: (docs) => onChange({ documents: docs }),
        });

    return (
        <div className="space-y-5">
            {/* Citizenship Status */}
            <SegmentedControl<boolean>
                ariaLabel="Citizenship status"
                value={data.isCitizen}
                onChange={(isCitizen) => {
                    onChange({
                        isCitizen,
                        // If changing to citizen, clear visa status
                        visaStatus: isCitizen ? null : data.visaStatus,
                    });
                }}
                options={[
                    { value: true, label: "Citizen", iconName: "user" },
                    { value: false, label: "Resident", iconName: "users" },
                ]}
            />

            {/* Visa Type Selection - Only for non-citizens */}
            {data.isCitizen === false && (
                <Select
                    label="Visa Type"
                    value={data.visaStatus || ""}
                    onChange={(e) => onChange({ visaStatus: e.target.value || null })}
                    options={VISA_TYPE_OPTIONS}
                />
            )}

            {/* Document uploads */}
            <div className="space-y-3">
                <Upload
                    docType="passport"
                    {...UploadPresets.passport}
                    value={getDocument("passport")}
                    onUpload={(file) => uploadDocument("passport", file)}
                    onRemove={() => removeDocument("passport")}
                    isLoading={isOperationInProgress("passport")}
                />

                {data.isCitizen === false && (
                    <Upload
                        docType="visa"
                        {...UploadPresets.visa}
                        value={getDocument("visa")}
                        onUpload={(file) => uploadDocument("visa", file)}
                        onRemove={() => removeDocument("visa")}
                        isLoading={isOperationInProgress("visa")}
                    />
                )}
            </div>
        </div>
    );
}
