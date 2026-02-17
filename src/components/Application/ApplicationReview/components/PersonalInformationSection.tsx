import React from "react";
import { Icon } from "@/components/common";
import { DefinitionList } from "./DefinitionList";
import { DefinitionItem } from "./DefinitionItem";
import { DocumentList } from "./DocumentList";
import type { UserProfile } from "@/types/user.types";

interface PersonalInformationSectionProps {
    user: UserProfile;
}

const IDENTITY_DOCUMENT_TYPES = ['passport', 'visa', 'drivingLicense', 'studentId', 'coe'];
const IDENTITY_DOCUMENT_LABELS: Record<string, string> = {
    passport: 'Passport',
    visa: 'Visa',
    drivingLicense: 'Driving License',
    studentId: 'Student ID',
    coe: 'Certificate of Enrollment',
};

export const PersonalInformationSection = React.memo(({ user }: PersonalInformationSectionProps) => {
    const formattedDateOfBirth = React.useMemo(() => {
        return user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : undefined;
    }, [user.date_of_birth]);

    const formattedGender = React.useMemo(() => {
        return user.gender?.replace(/_/g, " ");
    }, [user.gender]);

    const visaStatus = user.user_application_profile?.visa_status;
    const formattedVisaStatus = React.useMemo(() => {
        return visaStatus ? visaStatus.replace(/_/g, " ") : undefined;
    }, [visaStatus]);

    return (
        <div className="bg-card rounded-[var(--radius-card)] border border-border overflow-hidden">
            <div className="px-4 py-3 bg-surface-subtle border-b border-border">
                <h4 className="font-semibold text-text text-sm flex items-center">
                    <Icon name="user" className="w-4 h-4 mr-2 text-primary-600" />
                    Personal Profile
                </h4>
            </div>
            <div className="p-4">
                <DefinitionList columns={2}>
                    <DefinitionItem label="Full Name" value={user.full_name} />
                    {user.username && (
                        <DefinitionItem label="Username" value={user.username} />
                    )}
                    <DefinitionItem
                        label="Date of Birth"
                        value={formattedDateOfBirth}
                    />
                    {user.gender && (
                        <DefinitionItem
                            label="Gender"
                            value={formattedGender}
                            valueClassName="capitalize"
                        />
                    )}
                    {visaStatus && (
                        <DefinitionItem
                            label="Visa Status"
                            value={formattedVisaStatus}
                            valueClassName="capitalize"
                        />
                    )}
                    {user.native_language && (
                        <DefinitionItem label="Native Language" value={user.native_language} />
                    )}
                    {user.preferred_contact_method && (
                        <DefinitionItem
                            label="Preferred Contact"
                            value={user.preferred_contact_method}
                            valueClassName="capitalize"
                        />
                    )}
                </DefinitionList>

                {user.user_application_profile?.documents && (
                    <DocumentList
                        documents={user.user_application_profile.documents}
                        documentTypes={IDENTITY_DOCUMENT_TYPES}
                        documentLabels={IDENTITY_DOCUMENT_LABELS}
                        title="Identity Documents"
                    />
                )}
            </div>
        </div>
    );
});

PersonalInformationSection.displayName = "PersonalInformationSection";

