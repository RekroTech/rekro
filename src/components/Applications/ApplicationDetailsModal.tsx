"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal, Icon } from "@/components/common";
import { formatDateShort, formatRentalDuration } from "@/lib/utils";
import type { ApplicationWithDetails } from "./types";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { DefinitionItem, DefinitionList } from "@/components/ApplicationReview/components";

interface ApplicationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: ApplicationWithDetails;
}

export function ApplicationDetailsModal({
    isOpen,
    onClose,
    application,
}: ApplicationDetailsModalProps) {
    const [previewDocument, setPreviewDocument] = useState<{
        url: string;
        name: string;
        type?: string;
    } | null>(null);
    const applicant = application.applicant;
    const profile = applicant?.user_application_profile;

    // Document labels mapping
    const documentLabels: Record<string, string> = {
        passport: "Passport",
        visa: "Visa",
        drivingLicense: "Driving License",
        studentId: "Student ID",
        coe: "Certificate of Enrollment",
        employmentLetter: "Employment Letter",
        payslips: "Payslips",
        bankStatement: "Bank Statement",
        proofOfFunds: "Proof of Funds",
        referenceLetter: "Reference Letter",
        guarantorLetter: "Guarantor Letter",
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={application.properties.title}
                size="xl"
                secondaryButton={{
                    label: "Close",
                    onClick: onClose,
                    variant: "secondary",
                }}
            >
                <div className="space-y-5">
                    {/* Application Overview */}
                    <div className="bg-card rounded-[var(--radius-card-lg)] border border-border overflow-hidden shadow-[var(--shadow-card)]">
                        <div className="bg-gradient-to-br from-primary-50/50 to-surface-subtle dark:from-primary-900/20 dark:to-surface-subtle p-5 border-b border-border">
                            <p className="text-lg font-bold text-text">{application.units.name}</p>
                            <div className="flex items-baseline justify-between gap-4">
                                <div className="flex items-baseline gap-1">
                                    <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                                        ${application.total_rent}
                                    </p>
                                    <span className="text-sm font-medium text-text-muted">/week</span>
                                </div>
                                {application.proposed_rent && application.proposed_rent !== application.total_rent && (
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-sm text-text-muted">Proposed:</p>
                                        <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                                            ${application.proposed_rent}
                                        </p>
                                        <span className="text-xs font-medium text-text-muted">/week</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 justify-items-start">
                                <InfoBadge
                                    label="Reference"
                                    value={`#${application.id.substring(0, 8).toUpperCase()}`}
                                    icon="file"
                                    mono
                                />
                                <InfoBadge
                                    label="Move-in Date"
                                    value={formatDateShort(application.move_in_date)}
                                    icon="calendar"
                                />
                                <InfoBadge
                                    label="Duration"
                                    value={
                                        formatRentalDuration(application.rental_duration) || "N/A"
                                    }
                                    icon="calendar"
                                />
                                <InfoBadge
                                    label="Submitted"
                                    value={formatDateShort(application.submitted_at)}
                                    icon="check"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Applicant Information */}
                    {applicant && (
                        <div className="bg-card rounded-[var(--radius-card-lg)] border border-border overflow-hidden shadow-[var(--shadow-card)]">
                            <div className="bg-gradient-to-br from-surface-subtle to-surface-muted p-4 sm:p-5 border-b border-border">
                                <div className="flex items-start gap-4 sm:gap-5">
                                    {applicant.image_url ? (
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-card)] overflow-hidden border-4 border-primary-500/20 flex-shrink-0 shadow-lg ring-2 ring-primary-500/10">
                                            <Image
                                                src={applicant.image_url}
                                                alt={applicant.full_name || "Applicant"}
                                                width={96}
                                                height={96}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-card)] bg-surface-muted border-4 border-primary-500/20 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-primary-500/10">
                                            <Icon
                                                name="user"
                                                className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-lg sm:text-xl font-bold text-text mb-1.5">
                                            {applicant.full_name || "N/A"}
                                        </h5>
                                        <p className="text-sm text-text-muted mb-3 sm:mb-4">
                                            {applicant.occupation || "Occupation not specified"}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {applicant.email && (
                                                <ContactBadge
                                                    icon="mail"
                                                    value={applicant.email}
                                                    href={`mailto:${applicant.email}`}
                                                />
                                            )}
                                            {applicant.phone && (
                                                <ContactBadge
                                                    icon="phone"
                                                    value={applicant.phone}
                                                    href={`tel:${applicant.phone}`}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-5">
                                <DefinitionList columns={2}>
                                    <DefinitionItem
                                        label="Date of Birth"
                                        value={
                                            applicant.date_of_birth
                                                ? formatDateShort(applicant.date_of_birth)
                                                : "N/A"
                                        }
                                    />
                                    <DefinitionItem
                                        label="Gender"
                                        value={
                                            applicant.gender
                                                ? applicant.gender.replace("_", " ")
                                                : "N/A"
                                        }
                                    />
                                </DefinitionList>

                                {application.message && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <div className="bg-surface-subtle rounded-[var(--radius-input)] p-4 border border-border/50">
                                            <p className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-2">
                                                Message
                                            </p>
                                            <p className="text-sm text-text leading-relaxed">
                                                {application.message}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Financial & Employment Information */}
                    {profile && (
                        <div className="bg-card rounded-[var(--radius-card-lg)] border border-border overflow-hidden shadow-[var(--shadow-card)]">
                            <div className="px-4 sm:px-5 py-3 bg-surface-subtle border-b border-border">
                                <h5 className="text-sm font-semibold text-text uppercase tracking-wide">
                                    Financial & Employment
                                </h5>
                            </div>

                            <div className="p-4 sm:p-5">
                                <DefinitionList columns={2}>
                                    <DefinitionItem
                                        label="Employment Status"
                                        value={profile.employment_status || "N/A"}
                                    />
                                    <DefinitionItem
                                        label="Employment Type"
                                        value={profile.employment_type || "N/A"}
                                    />
                                    <DefinitionItem
                                        label="Income Source"
                                        value={profile.income_source || "N/A"}
                                    />
                                    <DefinitionItem
                                        label="Income Amount"
                                        value={
                                            profile.income_amount
                                                ? `$${profile.income_amount} ${profile.income_frequency || ""}`
                                                : "N/A"
                                        }
                                    />
                                    <DefinitionItem
                                        label="Student Status"
                                        value={profile.student_status || "N/A"}
                                    />
                                    <DefinitionItem
                                        label="Visa Status"
                                        value={profile.visa_status || "N/A"}
                                    />
                                </DefinitionList>

                                {profile.finance_support_details && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <div className="bg-surface-subtle rounded-[var(--radius-input)] p-4 border border-border/50">
                                            <p className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-2">
                                                Financial Support Details
                                            </p>
                                            <p className="text-sm text-text leading-relaxed">
                                                {profile.finance_support_details}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Additional Information */}
                    {profile && (
                        <div className="bg-card rounded-[var(--radius-card-lg)] border border-border overflow-hidden shadow-[var(--shadow-card)]">
                            <div className="px-4 sm:px-5 py-3 bg-surface-subtle border-b border-border">
                                <h5 className="text-sm font-semibold text-text uppercase tracking-wide">
                                    Additional Information
                                </h5>
                            </div>

                            <div className="p-4 sm:p-5">
                                <DefinitionList columns={2}>
                                    <DefinitionItem
                                        label="Has Pets"
                                        value={profile.has_pets ? "Yes" : "No"}
                                    />
                                    <DefinitionItem
                                        label="Smoker"
                                        value={profile.smoker ? "Yes" : "No"}
                                    />
                                    <DefinitionItem
                                        label="Emergency Contact"
                                        value={profile.emergency_contact_name || "N/A"}
                                    />
                                    <DefinitionItem
                                        label="Emergency Phone"
                                        value={profile.emergency_contact_phone || "N/A"}
                                    />
                                </DefinitionList>
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {profile?.documents && Object.keys(profile.documents).length > 0 && (
                        <div className="bg-card rounded-[var(--radius-card-lg)] border border-border overflow-hidden shadow-[var(--shadow-card)]">
                            <div className="px-4 sm:px-5 py-3 bg-surface-subtle border-b border-border">
                                <h5 className="text-sm font-semibold text-text uppercase tracking-wide">
                                    Uploaded Documents
                                </h5>
                            </div>

                            <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 gap-3">
                                    {Object.entries(profile.documents).map(([type, doc]) => (
                                        <div
                                            key={type}
                                            className="flex items-center justify-between bg-surface-subtle hover:bg-surface-muted transition-colors px-3 py-3 rounded-[var(--radius-input)] border border-border/50 group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-[var(--radius-input)] bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-700/50 flex items-center justify-center">
                                                    <Icon
                                                        name="file"
                                                        className="w-5 h-5 text-primary-600 dark:text-primary-400"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-text text-sm font-medium">
                                                        {documentLabels[type] || type}
                                                    </p>
                                                    <p className="text-text-muted text-xs truncate">
                                                        {doc.filename}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setPreviewDocument({
                                                        url: doc.url,
                                                        name: doc.filename,
                                                        type: documentLabels[type] || type,
                                                    })
                                                }
                                                className="flex-shrink-0 ml-3 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/40 dark:hover:bg-primary-900/60 text-primary-600 dark:text-primary-400 rounded-[var(--radius-input)] transition-colors text-xs font-medium flex items-center gap-1.5 border border-primary-200/50 dark:border-primary-700/50"
                                            >
                                                <Icon name="eye" className="w-3.5 h-3.5" />
                                                View
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Document Preview Modal */}
            {previewDocument && (
                <DocumentPreviewModal
                    isOpen={!!previewDocument}
                    onClose={() => setPreviewDocument(null)}
                    documentUrl={previewDocument.url}
                    documentName={previewDocument.name}
                    documentType={previewDocument.type}
                />
            )}
        </>
    );
}


// Helper component for info badges with icons
interface InfoBadgeProps {
    label: string;
    value: string;
    icon: "file" | "calendar" | "check" | "home" | "user" | "mail" | "phone" | "eye";
    mono?: boolean;
}

function InfoBadge({ label, value, icon, mono }: InfoBadgeProps) {
    return (
        <div className="flex flex-col gap-1.5 text-center">
            <div className="flex items-center justify-center gap-1.5">
                <Icon
                    name={icon}
                    className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0"
                />
                <p className="text-xs text-text-subtle font-medium uppercase tracking-wide">
                    {label}
                </p>
            </div>
            <p className={`text-sm font-semibold text-text ${mono ? "font-mono" : ""}`}>{value}</p>
        </div>
    );
}

// Helper component for contact badges
interface ContactBadgeProps {
    icon: "mail" | "phone";
    value: string;
    href: string;
}

function ContactBadge({ icon, value, href }: ContactBadgeProps) {
    return (
        <a
            href={href}
            className="flex items-center gap-1.5 text-xs bg-card border border-border px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-pill)] shadow-sm hover:bg-surface-subtle transition-colors group"
        >
            <Icon
                name={icon}
                className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 flex-shrink-0 group-hover:scale-110 transition-transform"
            />
            <span className="text-text truncate max-w-[200px] sm:max-w-none">{value}</span>
        </a>
    );
}
