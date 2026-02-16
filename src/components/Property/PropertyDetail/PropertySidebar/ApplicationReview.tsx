import React from "react";
import { Button, Icon } from "@/components/common";
import {
    useApplication,
    useCreateSnapshot,
    useHasApplied,
} from "@/lib/react-query/hooks/application/useApplications";
import { useProfile } from "@/lib/react-query/hooks/user";
import { Inclusion } from "@/components/Property/types";

interface ApplicationReviewProps {
    propertyId?: string;
    unitId?: string;
    applicationId: string;
    onSuccess: () => void;
    onCancel: () => void;
    onBack?: () => void;
    showBackButton?: boolean;
}

export function ApplicationReview({
    propertyId,
    unitId,
    applicationId,
    onSuccess,
    onCancel,
    onBack,
    showBackButton = false,
}: ApplicationReviewProps) {
    const { data: user } = useProfile();

    // Fetch the application we are reviewing (no list/filter loop).
    const {
        data: application,
        isLoading: isApplicationLoading,
        isError: isApplicationError,
    } = useApplication(applicationId);

    // Optional: still compute a duplicate application if propertyId/unitId are present.
    // NOTE: this hook currently fetches the full list internally.
    const existingApplication = useHasApplied(propertyId ?? "", unitId);

    // Prefer the explicit application; fall back to existingApplication when not yet available.
    const sourceApp = application ?? existingApplication;

    const moveInDate = sourceApp?.move_in_date ?? null;
    const rentalDuration = sourceApp?.rental_duration ?? null;
    const proposedRent = sourceApp?.proposed_rent ?? null;
    const totalRent = sourceApp?.total_rent ?? null;
    const isGroupApplication = sourceApp?.application_type === "group";

    // Use the create snapshot mutation
    const createSnapshotMutation = useCreateSnapshot();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!applicationId) {
            console.error("No application ID provided - cannot create snapshot");
            alert("Application must be saved before creating a snapshot");
            return;
        }

        try {
            await createSnapshotMutation.mutateAsync({
                applicationId,
                note: "Application submitted",
            });

            onSuccess();
        } catch (error) {
            console.error("Application submission failed:", error);
            alert("Failed to submit application. Please try again.");
        }
    };

    const isSubmitting = createSnapshotMutation.isPending;

    return (
        <form onSubmit={handleSubmit}>
            {/* Review Section - Review data from user profile and application*/}
            <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-text mb-4">Review Your Information</h3>
                <p className="text-sm text-text-muted mb-6">
                    Please review your profile information below. This data will be submitted with
                    your application.
                </p>

                {/* Personal Information */}
                <div className="bg-background-secondary rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-text mb-3 flex items-center">
                        <Icon name="user" className="w-4 h-4 mr-2" />
                        Personal Information
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-text-muted">Full Name:</span>
                            <span className="text-text font-medium">
                                {user?.full_name || "Not provided"}
                            </span>
                        </div>
                        {user?.username && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Username:</span>
                                <span className="text-text font-medium">{user.username}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-text-muted">Email:</span>
                            <span className="text-text font-medium">
                                {user?.email || "Not provided"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Phone:</span>
                            <span className="text-text font-medium">
                                {user?.phone || "Not provided"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">Date of Birth:</span>
                            <span className="text-text font-medium">
                                {user?.date_of_birth
                                    ? new Date(user.date_of_birth).toLocaleDateString()
                                    : "Not provided"}
                            </span>
                        </div>
                        {user?.gender && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Gender:</span>
                                <span className="text-text font-medium capitalize">
                                    {user.gender.replace(/_/g, " ")}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-text-muted">Occupation:</span>
                            <span className="text-text font-medium">
                                {user?.occupation || "Not provided"}
                            </span>
                        </div>
                        {user?.native_language && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Native Language:</span>
                                <span className="text-text font-medium">
                                    {user.native_language}
                                </span>
                            </div>
                        )}
                        {user?.preferred_contact_method && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Preferred Contact:</span>
                                <span className="text-text font-medium capitalize">
                                    {user.preferred_contact_method}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Information */}
                {user?.user_application_profile && (
                    <div className="bg-background-secondary rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-text mb-3 flex items-center">
                            <Icon name="dollar" className="w-4 h-4 mr-2" />
                            Financial Information
                        </h4>
                        <div className="space-y-2 text-sm">
                            {user.user_application_profile.employment_status && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Employment Status:</span>
                                    <span className="text-text font-medium capitalize">
                                        {user.user_application_profile.employment_status.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.employment_type && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Employment Type:</span>
                                    <span className="text-text font-medium capitalize">
                                        {user.user_application_profile.employment_type.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.income_source && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Income Source:</span>
                                    <span className="text-text font-medium capitalize">
                                        {user.user_application_profile.income_source.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.income_amount && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Income Amount:</span>
                                    <span className="text-text font-medium">
                                        $
                                        {user.user_application_profile.income_amount.toLocaleString()}
                                        {user.user_application_profile.income_frequency &&
                                            ` / ${user.user_application_profile.income_frequency}`}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.student_status && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Student Status:</span>
                                    <span className="text-text font-medium capitalize">
                                        {user.user_application_profile.student_status.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.finance_support_type && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Finance Support Type:</span>
                                    <span className="text-text font-medium capitalize">
                                        {user.user_application_profile.finance_support_type.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.finance_support_details && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">
                                        Finance Support Details:
                                    </span>
                                    <span className="text-text font-medium">
                                        {user.user_application_profile.finance_support_details}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.max_budget_per_week && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Max Budget Per Week:</span>
                                    <span className="text-text font-medium">
                                        $
                                        {user.user_application_profile.max_budget_per_week.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Additional Information */}
                {user?.user_application_profile && (
                    <div className="bg-background-secondary rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-text mb-3 flex items-center">
                            <Icon name="info" className="w-4 h-4 mr-2" />
                            Additional Information
                        </h4>
                        <div className="space-y-2 text-sm">
                            {user.user_application_profile.visa_status && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Visa Status:</span>
                                    <span className="text-text font-medium capitalize">
                                        {user.user_application_profile.visa_status.replace(
                                            "_",
                                            " "
                                        )}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.preferred_locality && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Preferred Locality:</span>
                                    <span className="text-text font-medium">
                                        {user.user_application_profile.preferred_locality}
                                    </span>
                                </div>
                            )}
                            {user.user_application_profile.has_pets !== null &&
                                user.user_application_profile.has_pets !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Has Pets:</span>
                                        <span className="text-text font-medium">
                                            {user.user_application_profile.has_pets ? "Yes" : "No"}
                                        </span>
                                    </div>
                                )}
                            {user.user_application_profile.smoker !== null &&
                                user.user_application_profile.smoker !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Smoker:</span>
                                        <span className="text-text font-medium">
                                            {user.user_application_profile.smoker ? "Yes" : "No"}
                                        </span>
                                    </div>
                                )}
                            {user.user_application_profile.emergency_contact_name && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Emergency Contact:</span>
                                        <span className="text-text font-medium">
                                            {user.user_application_profile.emergency_contact_name}
                                        </span>
                                    </div>
                                    {user.user_application_profile.emergency_contact_phone && (
                                        <div className="flex justify-between">
                                            <span className="text-text-muted">
                                                Emergency Phone:
                                            </span>
                                            <span className="text-text font-medium">
                                                {
                                                    user.user_application_profile
                                                        .emergency_contact_phone
                                                }
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Tenancy Details Review */}
                <div className="bg-background-secondary rounded-lg p-4">
                    <h4 className="font-semibold text-text mb-3 flex items-center">
                        <Icon name="calendar" className="w-4 h-4 mr-2" />
                        Tenancy Details
                    </h4>

                    {isApplicationLoading && (
                        <p className="text-sm text-text-muted">Loading tenancy details…</p>
                    )}

                    {!isApplicationLoading && isApplicationError && (
                        <p className="text-sm text-red-600">Failed to load tenancy details.</p>
                    )}

                    {!isApplicationLoading && !isApplicationError && !sourceApp && (
                        <p className="text-sm text-text-muted">
                            Tenancy details aren’t available yet. Please go back and save your
                            application first.
                        </p>
                    )}

                    {!isApplicationLoading && !isApplicationError && sourceApp && (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Move-in Date:</span>
                                <span className="text-text font-medium">
                                    {moveInDate
                                        ? new Date(moveInDate).toLocaleDateString()
                                        : "Not provided"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Tenancy Duration:</span>
                                <span className="text-text font-medium">
                                    {rentalDuration ? `${rentalDuration} months` : "Not provided"}
                                </span>
                            </div>
                            {proposedRent !== null && proposedRent !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Proposed Rent:</span>
                                    <span className="text-text font-medium">
                                        ${Number(proposedRent).toLocaleString()} per week
                                    </span>
                                </div>
                            )}
                            {totalRent !== null && totalRent !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Total Rent:</span>
                                    <span className="text-text font-medium">
                                        ${Number(totalRent).toLocaleString()} per week
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-text-muted">Application Type:</span>
                                <span className="text-text font-medium capitalize">
                                    {isGroupApplication ? "Group" : "Individual"}
                                </span>
                            </div>
                            {sourceApp.occupancy_type && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Occupancy Type:</span>
                                    <span className="text-text font-medium capitalize">
                                        {sourceApp.occupancy_type}
                                    </span>
                                </div>
                            )}
                            {sourceApp.status && (
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Status:</span>
                                    <span className="text-text font-medium capitalize">
                                        {sourceApp.status.replace("_", " ")}
                                    </span>
                                </div>
                            )}
                            {sourceApp.inclusions &&
                                Array.isArray(sourceApp.inclusions) &&
                                sourceApp.inclusions.length > 0 && (
                                    <div className="flex flex-col">
                                        <span className="text-text-muted mb-1">Inclusions:</span>
                                        <div className="space-y-1">
                                            {sourceApp.inclusions.map(
                                                (inclusion: Inclusion, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between text-xs bg-background px-2 py-1.5 rounded"
                                                    >
                                                        <span className="text-text font-medium capitalize">
                                                            {inclusion.type.replace("_", " ")}
                                                        </span>
                                                        <span className="text-text-muted">
                                                            {inclusion.price > 0
                                                                ? `+$${inclusion.price}/week`
                                                                : "Included"}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            {sourceApp.message && (
                                <div className="flex flex-col pt-2">
                                    <span className="text-text-muted mb-1">
                                        Message to Landlord:
                                    </span>
                                    <p className="text-text font-medium text-xs bg-background p-2 rounded">
                                        {sourceApp.message}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Completeness Notice */}
                {(!user?.user_application_profile || !user.phone || !user.date_of_birth) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                            <Icon
                                name="alert-circle"
                                className="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                            />
                            <div className="text-sm">
                                <p className="font-semibold text-yellow-800 mb-1">
                                    Incomplete Profile
                                </p>
                                <p className="text-yellow-700">
                                    Some information is missing from your profile. Completing your
                                    profile increases your chances of approval.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 sm:pt-6 gap-2 border-t border-input-border">
                {showBackButton && onBack ? (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none"
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
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none"
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </div>

            <p className="text-xs text-text-muted text-center mt-3 sm:mt-4">
                Your information will be sent to the property owner for review.
            </p>
        </form>
    );
}
