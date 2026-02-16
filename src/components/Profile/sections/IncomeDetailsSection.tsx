"use client";

import { Input, Select, Upload, SegmentedControl } from "@/components/common";
import type { IncomeDetailsFormState } from "../types";

interface IncomeDetailsSectionProps {
  data: IncomeDetailsFormState;
  uploadedDocs: string[];
  onChange: (data: Partial<IncomeDetailsFormState>) => void;
  onUpload: (docType: string, file: File) => void;
  onRemove: (docType: string) => void;
}

export function IncomeDetailsSection({
  data,
  uploadedDocs,
  onChange,
  onUpload,
  onRemove,
}: IncomeDetailsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Work status */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-gray-900">Employment Status</h4>
        <SegmentedControl<boolean>
          ariaLabel="Employment status"
          value={data.isWorking}
          onChange={(isWorking) =>
            onChange({
              isWorking,
              // If they choose working, they can't be a student.
              isStudent: isWorking ? false : data.isStudent,
            })
          }
          options={[
            { value: true, label: "Working", iconName: "building" },
            { value: false, label: "Not working", iconName: "user" },
          ]}
        />
      </div>

      {/* Working: YES - employment details */}
      {data.isWorking === true && (
        <div className="space-y-4">
          <Select
            label="Employment Type"
            value={data.employmentStatus || ""}
            onChange={(e) => onChange({ employmentStatus: e.target.value || null })}
            options={[
              { value: "", label: "Select employment status" },
              { value: "full-time", label: "Full-time employed" },
              { value: "part-time", label: "Part-time employed" },
              { value: "self-employed", label: "Self-employed" },
              { value: "contractor", label: "Contractor/Freelancer" },
            ]}
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
              options={[
                { value: "", label: "Select frequency" },
                { value: "weekly", label: "Weekly" },
                { value: "fortnightly", label: "Fortnightly" },
                { value: "monthly", label: "Monthly" },
                { value: "annually", label: "Annually" },
              ]}
            />

            <Input
              label="Amount ($)"
              type="number"
              inputMode="decimal"
              value={data.incomeAmount?.toString() || ""}
              onChange={(e) =>
                onChange({
                  incomeAmount: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder="Amount"
            />
          </div>

          <div className="space-y-3">
            <Upload
              label="Payslips"
              required
              helperText="Upload your last 3 months of payslips (PDF/JPG/PNG, max 2MB)."
              accept=".pdf,.jpg,.jpeg,.png"
              maxSizeMB={2}
              fieldName="payslips"
              value={uploadedDocs.includes("payslips") ? new File([], "payslips") : null}
              onChange={(file) => {
                if (file) onUpload("payslips", file);
                else onRemove("payslips");
              }}
            />

            <Upload
              label="Bank Statements"
              helperText="Upload your last 3 months of bank statements (PDF/JPG/PNG, max 2MB)."
              accept=".pdf,.jpg,.jpeg,.png"
              maxSizeMB={2}
              fieldName="bankStatement"
              value={
                uploadedDocs.includes("bankStatement")
                  ? new File([], "bankStatement")
                  : null
              }
              onChange={(file) => {
                if (file) onUpload("bankStatement", file);
                else onRemove("bankStatement");
              }}
            />
          </div>
        </div>
      )}

      {/* Working: NO - student status */}
      {data.isWorking === false && (
        <div className="space-y-5">
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-900">Student Status</h4>
            <SegmentedControl<boolean>
              ariaLabel="Student status"
              value={data.isStudent}
              onChange={(isStudent) => onChange({ isStudent })}
              options={[
                { value: true, label: "Student", iconName: "book" },
                { value: false, label: "Not a student", iconName: "user" },
              ]}
            />
          </div>

          {/* Student: YES */}
          {data.isStudent === true && (
            <div className="space-y-4">
              <Select
                label="How is your living financed?"
                value={data.financeSupportType || ""}
                onChange={(e) => onChange({ financeSupportType: e.target.value || null })}
                options={[
                  { value: "", label: "Select finance support type" },
                  { value: "savings", label: "Personal Savings" },
                  { value: "parents", label: "Parents/Family Support" },
                  { value: "scholarship", label: "Scholarship" },
                  { value: "student-loan", label: "Student Loan" },
                  { value: "investments", label: "Investments/Dividends" },
                  { value: "other", label: "Other" },
                ]}
              />

              <Input
                label="Finance support details"
                type="text"
                value={data.financeSupportDetails || ""}
                onChange={(e) => onChange({ financeSupportDetails: e.target.value || null })}
                placeholder="Please provide additional details about your financial support"
              />

              <div className="space-y-3">
                <h6 className="text-sm font-medium text-gray-900">Finance Support Documents</h6>

                <Upload
                  label="Student ID"
                  required
                  helperText="Upload your current student ID card (PDF/JPG/PNG, max 2MB)."
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSizeMB={2}
                  fieldName="studentId"
                  value={uploadedDocs.includes("studentId") ? new File([], "studentId") : null}
                  onChange={(file) => {
                    if (file) onUpload("studentId", file);
                    else onRemove("studentId");
                  }}
                />

                <Upload
                  label="Confirmation of Enrollment (CoE)"
                  required
                  helperText="Upload your current semester CoE (PDF/JPG/PNG, max 2MB)."
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSizeMB={2}
                  fieldName="coe"
                  value={uploadedDocs.includes("coe") ? new File([], "coe") : null}
                  onChange={(file) => {
                    if (file) onUpload("coe", file);
                    else onRemove("coe");
                  }}
                />

                <Upload
                  label="Proof of Financial Support"
                  required
                  helperText="Bank statements, scholarship letters, or sponsor documents (PDF/JPG/PNG, max 2MB)."
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSizeMB={2}
                  fieldName="proofOfFunds"
                  value={
                    uploadedDocs.includes("proofOfFunds")
                      ? new File([], "proofOfFunds")
                      : null
                  }
                  onChange={(file) => {
                    if (file) onUpload("proofOfFunds", file);
                    else onRemove("proofOfFunds");
                  }}
                />
              </div>
            </div>
          )}

          {/* Not Student */}
          {data.isStudent === false && (
            <div className="space-y-4">
              <Select
                label="How is your living financed?"
                value={data.financeSupportType || ""}
                onChange={(e) => onChange({ financeSupportType: e.target.value || null })}
                options={[
                  { value: "", label: "Select finance support type" },
                  { value: "savings", label: "Personal Savings" },
                  { value: "parents", label: "Parents/Family Support" },
                  { value: "investments", label: "Investments/Dividends" },
                  { value: "pension", label: "Pension/Retirement" },
                  { value: "other", label: "Other" },
                ]}
              />

              <Input
                label="Finance details"
                type="text"
                value={data.financeSupportDetails || ""}
                onChange={(e) => onChange({ financeSupportDetails: e.target.value || null })}
                placeholder="Please provide additional details about your financial situation"
              />

              <div className="space-y-3">
                <h6 className="text-sm font-medium text-gray-900">Financial Documents</h6>
                <Upload
                  label="Proof of Funds"
                  required
                  helperText="Upload bank statements or other proof of funds (PDF/JPG/PNG, max 2MB)."
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSizeMB={2}
                  fieldName="proofOfFunds"
                  value={
                    uploadedDocs.includes("proofOfFunds")
                      ? new File([], "proofOfFunds")
                      : null
                  }
                  onChange={(file) => {
                    if (file) onUpload("proofOfFunds", file);
                    else onRemove("proofOfFunds");
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

