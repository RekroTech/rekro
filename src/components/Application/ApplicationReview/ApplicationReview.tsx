import { useMemo } from "react";
import { useApplication } from "@/lib/react-query/hooks/application";
import { useProfile } from "@/lib/react-query/hooks/user";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import {
    ApplicantHeader,
    PersonalInformationSection,
    FinancialInformationSection,
    AdditionalInformationSection,
    TenancyDetailsSection,
    ProfileCompletenessNotice,
} from "./components";
import { getPropertyTypeDisplay } from "../utils";

interface ApplicationReviewProps {
    applicationId?: string;
    property: Property;
    selectedUnit: Unit;
}

export function ApplicationReview({
    applicationId,
    property,
    selectedUnit,
}: ApplicationReviewProps) {
    const { data: user } = useProfile();

    // Fetch the application we are reviewing
    const {
        data: application,
        isLoading: isApplicationLoading,
        isError: isApplicationError,
    } = useApplication({ id: applicationId || "" });

    // Memoized values
    const propertyTypeDisplay = useMemo(
        () => getPropertyTypeDisplay(property, selectedUnit),
        [property, selectedUnit]
    );

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Applicant Header */}
            <ApplicantHeader user={user} propertyTypeDisplay={propertyTypeDisplay} />

            {/* Main Content Sections */}
            <div className="space-y-4">
                {/* Personal Information */}
                <PersonalInformationSection user={user} />

                {/* Financial Information */}
                {user.user_application_profile && <FinancialInformationSection user={user} />}

                {/* Additional Information */}
                {user.user_application_profile && <AdditionalInformationSection user={user} />}

                {/* Tenancy Details */}
                <TenancyDetailsSection
                    application={application}
                    isLoading={isApplicationLoading}
                    isError={isApplicationError}
                />
            </div>

            {/* Profile Completeness Notice */}
            <ProfileCompletenessNotice user={user} />
        </div>
    );
}


