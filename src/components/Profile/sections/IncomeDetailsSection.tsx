"use client";

import type { EmploymentStatus } from "@/types/db";
import { Input, Select, SegmentedControl, Upload, UploadPresets } from "@/components/common";
import { useDocumentManager } from "../hooks";
import type { IncomeDetailsFormState } from "../types";
import {
    EMPLOYMENT_TYPE_OPTIONS,
    FINANCE_SUPPORT_OPTIONS_STUDENT,
    FINANCE_SUPPORT_OPTIONS_NON_STUDENT,
    INCOME_FREQUENCY_OPTIONS,
} from "../constants";

interface IncomeDetailsSectionProps {
    userId: string;
    data: IncomeDetailsFormState;
    onChange: (data: Partial<IncomeDetailsFormState>) => void;
}

/**
 * Income Details Section
 * Handles employment status, income information, student status, and related document uploads
 * Uses Upload component and useDocumentManager hook for consistent behavior
 */
export function IncomeDetailsSection({ userId, data, onChange }: IncomeDetailsSectionProps) {

    const { uploadDocument, removeDocument, getDocument, isOperationInProgress } =
        useDocumentManager({
            userId,
            documents: data.documents || {},
            onDocumentsChange: (docs) => onChange({ documents: docs }),
        });

    return (
        <div className="space-y-6">
            {/* Work status */}
            <div className="space-y-3">
                <SegmentedControl<EmploymentStatus>
                    ariaLabel="Employment status"
                    value={data.employmentStatus ?? "working"}
                    onChange={(employmentStatus) =>
                        onChange({
                            employmentStatus,
                            studentStatus: data.studentStatus,
                        })
                    }
                    options={[
                        { value: "working", label: "Working", iconName: "building" },
                        { value: "not_working", label: "Not working", iconName: "user" },
                    ]}
                />
            </div>

            {/* Working: YES - employment details */}
            {data.employmentStatus === "working" && (
                <div className="space-y-4">
                    <Select
                        label="Employment Type"
                        value={data.employmentType || ""}
                        onChange={(e) => onChange({ employmentType: e.target.value || null })}
                        options={EMPLOYMENT_TYPE_OPTIONS}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Income Source"
                            type="text"
                            value={data.incomeSource || ""}
                            onChange={(e) => onChange({ incomeSource: e.target.value || null })}
                            placeholder="e.g., Salary, Business"
                        />

                        <Select
                            label="Frequency"
                            value={data.incomeFrequency || ""}
                            onChange={(e) => onChange({ incomeFrequency: e.target.value || null })}
                            options={INCOME_FREQUENCY_OPTIONS}
                        />

                        <Input
                            label="Amount ($)"
                            type="number"
                            inputMode="decimal"
                            value={data.incomeAmount?.toString() || ""}
                            onChange={(e) =>
                                onChange({
                                    incomeAmount: e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                })
                            }
                            placeholder="Amount"
                        />
                    </div>

                    <div className="space-y-3">
                        <Upload
                            docType="payslips"
                            {...UploadPresets.payslips}
                            value={getDocument("payslips")}
                            onUpload={(file) => uploadDocument("payslips", file)}
                            onRemove={() => removeDocument("payslips")}
                            isLoading={isOperationInProgress("payslips")}
                        />

                        <Upload
                            docType="bankStatement"
                            {...UploadPresets.bankStatement}
                            value={getDocument("bankStatement")}
                            onUpload={(file) => uploadDocument("bankStatement", file)}
                            onRemove={() => removeDocument("bankStatement")}
                            isLoading={isOperationInProgress("bankStatement")}
                        />
                    </div>
                </div>
            )}

            {/* Working: NO - student status */}
            {data.employmentStatus === "not_working" && (
                <div className="space-y-5">
                    <div className="space-y-3">
                        <h4 className="text-md font-semibold text-gray-900">Student Status</h4>
                        <SegmentedControl<"student" | "not_student">
                            ariaLabel="Student status"
                            value={data.studentStatus ?? "not_student"}
                            onChange={(studentStatus) => onChange({ studentStatus })}
                            options={[
                                { value: "student", label: "Student", iconName: "book" },
                                { value: "not_student", label: "Not a student", iconName: "user" },
                            ]}
                        />
                    </div>

                    {/* Student: YES */}
                    {data.studentStatus === "student" && (
                        <div className="space-y-4">
                            <Select
                                label="How is your living financed?"
                                value={data.financeSupportType || ""}
                                onChange={(e) =>
                                    onChange({ financeSupportType: e.target.value || null })
                                }
                                options={FINANCE_SUPPORT_OPTIONS_STUDENT}
                            />

                            <Input
                                label="Finance support details"
                                type="text"
                                value={data.financeSupportDetails || ""}
                                onChange={(e) =>
                                    onChange({ financeSupportDetails: e.target.value || null })
                                }
                                placeholder="Please provide additional details about your financial support"
                            />

                            <div className="space-y-3">
                                <h6 className="text-sm font-medium text-gray-900">
                                    Finance Support Documents
                                </h6>

                                <Upload
                                    docType="studentId"
                                    {...UploadPresets.studentId}
                                    value={getDocument("studentId")}
                                    onUpload={(file) => uploadDocument("studentId", file)}
                                    onRemove={() => removeDocument("studentId")}
                                    isLoading={isOperationInProgress("studentId")}
                                />

                                <Upload
                                    docType="coe"
                                    {...UploadPresets.coe}
                                    value={getDocument("coe")}
                                    onUpload={(file) => uploadDocument("coe", file)}
                                    onRemove={() => removeDocument("coe")}
                                    isLoading={isOperationInProgress("coe")}
                                />

                                <Upload
                                    docType="proofOfFunds"
                                    {...UploadPresets.proofOfFunds}
                                    value={getDocument("proofOfFunds")}
                                    onUpload={(file) => uploadDocument("proofOfFunds", file)}
                                    onRemove={() => removeDocument("proofOfFunds")}
                                    isLoading={isOperationInProgress("proofOfFunds")}
                                />
                            </div>
                        </div>
                    )}

                    {/* Not Student */}
                    {data.studentStatus === "not_student" && (
                        <div className="space-y-4">
                            <Select
                                label="How is your living financed?"
                                value={data.financeSupportType || ""}
                                onChange={(e) =>
                                    onChange({ financeSupportType: e.target.value || null })
                                }
                                options={FINANCE_SUPPORT_OPTIONS_NON_STUDENT}
                            />

                            <Input
                                label="Finance details"
                                type="text"
                                value={data.financeSupportDetails || ""}
                                onChange={(e) =>
                                    onChange({ financeSupportDetails: e.target.value || null })
                                }
                                placeholder="Please provide additional details about your financial situation"
                            />

                            <div className="space-y-3">
                                <h6 className="text-sm font-medium text-text">
                                    Financial Documents
                                </h6>
                                <Upload
                                    docType="proofOfFunds"
                                    {...UploadPresets.proofOfFunds}
                                    required
                                    helperText="Upload bank statements or other proof of funds (PDF/JPG/PNG, max 2MB)."
                                    value={getDocument("proofOfFunds")}
                                    onUpload={(file) => uploadDocument("proofOfFunds", file)}
                                    onRemove={() => removeDocument("proofOfFunds")}
                                    isLoading={isOperationInProgress("proofOfFunds")}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
