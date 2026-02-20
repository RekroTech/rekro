import React from "react";
import { clsx } from "clsx";
import { Icon } from "@/components/common";
import { DocumentList } from "./DocumentList";
import type { UserProfile } from "@/types/user.types";

interface AdditionalInformationSectionProps {
    user: UserProfile;
}

const REFERENCE_DOCUMENT_TYPES = ['referenceLetter', 'guarantorLetter'];
const REFERENCE_DOCUMENT_LABELS: Record<string, string> = {
    referenceLetter: 'Reference Letter',
    guarantorLetter: 'Guarantor Letter',
};

export const AdditionalInformationSection = React.memo(({ user }: AdditionalInformationSectionProps) => {
    const profile = user.user_application_profile;

    if (!profile) {
        return null;
    }

    const hasPreferences =
        (profile.has_pets !== null && profile.has_pets !== undefined) ||
        (profile.smoker !== null && profile.smoker !== undefined);

    const hasEmergencyContact = Boolean(profile.emergency_contact_name);

    return (
        <div className="bg-card rounded-[var(--radius-card)] border border-border overflow-hidden">
            <div className="px-4 py-3 bg-surface-subtle border-b border-border">
                <h4 className="font-semibold text-text text-sm flex items-center">
                    <Icon name="info" className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400" />
                    Additional Information
                </h4>
            </div>
            <div className="p-4">
                {/* Preferences */}
                {hasPreferences && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-text-muted text-xs block mb-3 uppercase tracking-wide font-semibold">
                            Preferences
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {profile.has_pets !== null && profile.has_pets !== undefined && (
                                <PreferenceBadge
                                    label={profile.has_pets ? "Has Pets" : "No Pets"}
                                    isActive={profile.has_pets}
                                    icon={profile.has_pets ? "check" : "x"}
                                    variant="primary"
                                />
                            )}
                            {profile.smoker !== null && profile.smoker !== undefined && (
                                <PreferenceBadge
                                    label={profile.smoker ? "Smoker" : "Non-Smoker"}
                                    isActive={profile.smoker}
                                    icon={profile.smoker ? "check" : "x"}
                                    variant="warning"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Emergency Contact */}
                {hasEmergencyContact && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-text-muted text-xs block mb-2">Emergency Contact</span>
                        <div className="bg-panel px-3 py-2.5 rounded-[var(--radius-input)]">
                            <p className="text-text text-sm font-medium mb-1">
                                {profile.emergency_contact_name}
                            </p>
                            {profile.emergency_contact_phone && (
                                <p className="text-text-muted text-xs flex items-center gap-1.5">
                                    <Icon name="phone" className="w-3 h-3" />
                                    {profile.emergency_contact_phone}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Reference Documents */}
                {profile.documents && (
                    <DocumentList
                        documents={profile.documents}
                        documentTypes={REFERENCE_DOCUMENT_TYPES}
                        documentLabels={REFERENCE_DOCUMENT_LABELS}
                        title="Reference Documents"
                    />
                )}
            </div>
        </div>
    );
});

AdditionalInformationSection.displayName = "AdditionalInformationSection";

interface PreferenceBadgeProps {
    label: string;
    isActive: boolean;
    icon: "check" | "x";
    variant: "primary" | "warning";
}

const PreferenceBadge = React.memo(({ label, isActive, icon, variant }: PreferenceBadgeProps) => {
    return (
        <span
            className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                isActive && variant === "primary" && "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700",
                isActive && variant === "warning" && "bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-700",
                !isActive && "bg-surface-muted text-text-muted border border-border"
            )}
        >
            <Icon name={icon} className="w-3.5 h-3.5" />
            {label}
        </span>
    );
});

PreferenceBadge.displayName = "PreferenceBadge";
