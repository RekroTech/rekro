import React from "react";
import { Icon } from "@/components/common";
import { DefinitionList } from "./DefinitionList";
import { DefinitionItem } from "./DefinitionItem";
import { DocumentList } from "./DocumentList";
import type { UserProfile } from "@/types/user.types";

interface FinancialInformationSectionProps {
    user: UserProfile;
}

const FINANCIAL_DOCUMENT_TYPES = ['employmentLetter', 'payslips', 'bankStatement', 'proofOfFunds'];
const FINANCIAL_DOCUMENT_LABELS: Record<string, string> = {
    employmentLetter: 'Employment Letter',
    payslips: 'Payslips',
    bankStatement: 'Bank Statement',
    proofOfFunds: 'Proof of Funds',
};

export const FinancialInformationSection = React.memo(({ user }: FinancialInformationSectionProps) => {
    const profile = user.user_application_profile;

    const formattedEmploymentStatus = profile?.employment_status?.replace("_", " ");
    const formattedEmploymentType = profile?.employment_type?.replace("_", " ");
    const formattedIncomeSource = profile?.income_source?.replace("_", " ");
    const formattedFinanceSupportType = profile?.finance_support_type?.replace("_", " ");

    const formattedIncome = profile?.income_amount ? (
        <span className="whitespace-nowrap">
            ${profile.income_amount.toLocaleString()}
            {profile.income_frequency ? ` / ${profile.income_frequency}` : ""}
        </span>
    ) : undefined;

    const hasFinancialSupport = !!(profile?.finance_support_type || profile?.finance_support_details);

    if (!profile) {
        return null;
    }

    return (
        <div className="bg-card rounded-[var(--radius-card)] border border-border overflow-hidden">
            <div className="px-4 py-3 bg-surface-subtle border-b border-border">
                <h4 className="font-semibold text-text text-sm flex items-center">
                    <Icon name="dollar" className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                    Financial Information
                </h4>
            </div>
            <div className="p-4">
                <DefinitionList columns={2}>
                    {profile.employment_status && (
                        <DefinitionItem
                            label="Employment Status"
                            value={formattedEmploymentStatus}
                            valueClassName="capitalize"
                        />
                    )}
                    {profile.employment_type && (
                        <DefinitionItem
                            label="Employment Type"
                            value={formattedEmploymentType}
                            valueClassName="capitalize"
                        />
                    )}
                    {profile.income_source && (
                        <DefinitionItem
                            label="Income Source"
                            value={formattedIncomeSource}
                            valueClassName="capitalize"
                        />
                    )}
                    {profile.income_amount && (
                        <DefinitionItem
                            label="Income"
                            value={formattedIncome}
                        />
                    )}
                </DefinitionList>

                {/* Financial Support */}
                {hasFinancialSupport && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-text-muted text-xs block mb-2">Financial Support</span>
                        <div className="bg-panel px-3 py-2.5 rounded-[var(--radius-input)]">
                            {profile.finance_support_type && (
                                <p className="text-text text-sm font-medium mb-1 capitalize">
                                    {formattedFinanceSupportType}
                                </p>
                            )}
                            {profile.finance_support_details && (
                                <p className="text-text-muted text-xs">
                                    {profile.finance_support_details}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Financial Documents */}
                {profile.documents && (
                    <DocumentList
                        documents={profile.documents}
                        documentTypes={FINANCIAL_DOCUMENT_TYPES}
                        documentLabels={FINANCIAL_DOCUMENT_LABELS}
                        title="Supporting Documents"
                    />
                )}
            </div>
        </div>
    );
});

FinancialInformationSection.displayName = "FinancialInformationSection";

