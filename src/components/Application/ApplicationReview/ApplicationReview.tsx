import React, { useCallback, useMemo } from "react";
import { Button, Icon } from "@/components/common";
import {
    useApplication,
    useCreateSnapshot,
} from "@/lib/react-query/hooks/application/useApplications";
import { useProfile } from "@/lib/react-query/hooks/user";
import { useToast } from "@/hooks/useToast";
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
    onSuccess: () => void;
    onCancel: () => void;
    onBack?: () => void;
}

export function ApplicationReview({
    applicationId,
    property,
    selectedUnit,
    onSuccess,
    onCancel,
    onBack,
}: ApplicationReviewProps) {
    const { data: user } = useProfile();
    const { showToast } = useToast();

    // Fetch the application we are reviewing
    const {
        data: application,
        isLoading: isApplicationLoading,
        isError: isApplicationError,
    } = useApplication(applicationId ?? null);

    const createSnapshotMutation = useCreateSnapshot();

    // Memoized values
    const propertyTypeDisplay = useMemo(
        () => getPropertyTypeDisplay(property, selectedUnit),
        [property, selectedUnit]
    );

    const isSubmitting = createSnapshotMutation.isPending;

    // Callbacks
    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!applicationId) {
                console.error("No application ID provided - cannot create snapshot");
                showToast("Application must be saved before submitting", "error");
                return;
            }

            try {
                await createSnapshotMutation.mutateAsync({
                    applicationId,
                    note: "Application submitted",
                });

                showToast("Application submitted successfully!", "success");
                onSuccess();
            } catch (error) {
                console.error("Application submission failed:", error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to submit application. Please try again.";
                showToast(errorMessage, "error");
            }
        },
        [applicationId, createSnapshotMutation, onSuccess, showToast]
    );

    const handleBack = useCallback(() => {
        if (onBack) {
            onBack();
        }
    }, [onBack]);

    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    if (!user) {
        return null;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Form Actions */}
            <FormActions
                onBack={onBack ? handleBack : undefined}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                canSubmit={Boolean(application)}
            />
        </form>
    );
}

interface FormActionsProps {
    onBack?: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    canSubmit: boolean;
}

const FormActions = React.memo(
    ({ onBack, onCancel, isSubmitting, canSubmit }: FormActionsProps) => {
        return (
            <div className="sticky bottom-0 bg-card border-t border-border pt-4 -mx-6 px-6 -mb-6 pb-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                    {onBack ? (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onBack}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            <Icon name="chevron-left" className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || !canSubmit}
                        className="flex-1"
                    >
                        {isSubmitting ? (
                            <>
                                <Icon name="spinner" className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Icon name="check" className="w-4 h-4 mr-2" />
                                Submit Application
                            </>
                        )}
                    </Button>
                </div>
                <p className="text-xs text-text-muted text-center">
                    Your information will be sent to the property owner for review.
                </p>
            </div>
        );
    }
);

FormActions.displayName = "FormActions";
