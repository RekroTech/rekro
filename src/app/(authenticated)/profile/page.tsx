"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useProfile } from "@/lib/react-query/hooks/user";
import { BackButton, Button, Icon, Loader } from "@/components/common";
import {
    ProfileCard,
    ProfileSectionCard,
    DocumentsSection,
    RentalPreferencesSection,
    ResidencySection,
    IncomeDetailsSection,
    PersonalDetailsSection,
} from "@/components/Profile";
import { useToast } from "@/hooks/useToast";
import { useProfileForm } from "@/components/Profile/hooks/useProfileForm";
import { useProfileSave } from "@/components/Profile/hooks/useProfileSave";
import { useProfileImage } from "@/components/Profile/hooks/useProfileImage";
import { useSectionExpansion } from "@/components/Profile/hooks/useSectionExpansion";
import { useProfileCompletion } from "@/contexts";
import { buildShareableProfile } from "@/components/Profile/shareable-profile";
import { DocumentOperationsProvider, useDocumentOperations } from "@/components/Profile/contexts/DocumentOperationsContext";

function ProfilePageContent() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();

    // Data fetching
    const { data: user, isLoading: userLoading } = useProfile();

    // Form state management
    const {
        state: formState,
        updatePersonalDetails,
        updateResidency,
        updateIncomeDetails,
        updateRentalPreferences,
        updateDocuments,
        commitBaseline,
        hasChanges,
    } = useProfileForm(user);

    // Save operations
    const { saveProfileAsync, savePersonalDetailsOnlyAsync, isSaving } = useProfileSave({
        onSuccess: showSuccess,
        onError: showError,
    });

    // Profile image upload
    const { uploadImage, isUploading: isUploadingImage } = useProfileImage({
        userId: user?.id,
        onSuccess: showSuccess,
        onError: showError,
    });

    // Section expansion state
    const { expandedSections, toggleSection, collapseAll } = useSectionExpansion();

    // Profile completion from context
    const { calculateWithFormState } = useProfileCompletion();

    // Document operations state from context
    const { isAnyOperationInProgress: isAnyDocumentOperationInProgress } = useDocumentOperations();

    // Build derived data - calculate with current form state for real-time updates
    const profileCompletion = calculateWithFormState(
        { ...formState.incomeDetails, ...formState.residency },
        formState.documents
    );
    const shareableProfile = user ? buildShareableProfile(user, formState) : null;
    const isTenant = true;

    // Track when profile reaches 100% completion
    const hasShownCompletionToast = useRef(false);

    useEffect(() => {
        if (profileCompletion.isComplete && !hasShownCompletionToast.current) {
            // Collapse all sections
            collapseAll();

            // Show success toast
            showSuccess("Congratulations! You are ready to apply for any property 🎉");

            // Mark as shown to prevent repeated toasts
            hasShownCompletionToast.current = true;
        }

        // Reset flag if profile becomes incomplete again
        if (!profileCompletion.isComplete && hasShownCompletionToast.current) {
            hasShownCompletionToast.current = false;
        }
    }, [profileCompletion.isComplete, collapseAll, showSuccess]);

    // Handlers
    const handleSavePersonalDetails = async () => {
        try {
            await savePersonalDetailsOnlyAsync(formState);
            commitBaseline();
        } catch {
            // errors are handled by react-query + onError callback
        }
    };

    const handleSaveWholeProfile = async () => {
        try {
            await saveProfileAsync(formState);
            commitBaseline();
        } catch {
            // errors are handled by react-query + onError callback
        }
    };

    // Loading and auth states
    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    if (!user) {
        router.push("/login");
        return null;
    }



    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative bg-gray-50">
                {/* Header */}
                <div className="py-4 sm:py-6 flex items-center justify-between gap-4 sticky top-14 sm:top-16 z-10 bg-neutral-50">
                    <BackButton />

                    <Button
                        type="button"
                        onClick={handleSaveWholeProfile}
                        disabled={isSaving || isUploadingImage || !hasChanges || isAnyDocumentOperationInProgress}
                        loading={isSaving}
                        variant="primary"
                        size="md"
                    >
                        Save Profile
                    </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
                    {/* Left Column - Shareable Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-39">
                            {shareableProfile && (
                                <ProfileCard
                                    profile={shareableProfile}
                                    editable={true}
                                    onImageUpdate={uploadImage}
                                    isUploadingImage={isUploadingImage}
                                />
                            )}

                            {/* Badges */}
                            {profileCompletion.unlockedBadges.length > 0 && (
                                <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Icon name="star" className="w-5 h-5 text-yellow-500" />
                                        Your Badges
                                    </h3>
                                    <div className="space-y-2">
                                        {profileCompletion.unlockedBadges.map((badge) => (
                                            <div
                                                key={badge}
                                                className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg"
                                            >
                                                <Icon
                                                    name="check-circle"
                                                    className="w-5 h-5 text-yellow-600"
                                                />
                                                <span className="text-sm font-medium text-gray-900">
                                                    {badge}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Profile Sections */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Details Section */}
                        <ProfileSectionCard
                            title="Personal Details"
                            description="Basic information about you"
                            icon="profile"
                            completed={
                                profileCompletion.sections.find((s) => s.id === "personal-details")
                                    ?.completed || false
                            }
                            completionPercentage={
                                profileCompletion.sections.find((s) => s.id === "personal-details")
                                    ?.completionPercentage || 0
                            }
                            isExpanded={expandedSections["personal-details"]}
                            onToggle={() => toggleSection("personal-details")}
                        >
                            <PersonalDetailsSection
                                userEmail={user.email || ""}
                                value={formState.personalDetails}
                                onChange={updatePersonalDetails}
                                onSave={handleSavePersonalDetails}
                                isSaving={isSaving}
                            />
                        </ProfileSectionCard>

                        {/* Visa Details Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Visa Details"
                                description="Citizenship status and visa documentation"
                                icon="map-pin"
                                completed={
                                    profileCompletion.sections.find((s) => s.id === "visa-details")
                                        ?.completed || false
                                }
                                completionPercentage={
                                    profileCompletion.sections.find((s) => s.id === "visa-details")
                                        ?.completionPercentage || 0
                                }
                                isExpanded={expandedSections["visa-details"]}
                                onToggle={() => toggleSection("visa-details")}
                            >
                                <ResidencySection
                                    userId={user.id}
                                    data={formState.residency}
                                    onChange={updateResidency}
                                />
                            </ProfileSectionCard>
                        )}

                        {/* Income Details Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Income Details"
                                description="Employment and financial information"
                                icon="dollar"
                                completed={
                                    profileCompletion.sections.find(
                                        (s) => s.id === "income-details"
                                    )?.completed || false
                                }
                                completionPercentage={
                                    profileCompletion.sections.find(
                                        (s) => s.id === "income-details"
                                    )?.completionPercentage || 0
                                }
                                isExpanded={expandedSections["income-details"]}
                                onToggle={() => toggleSection("income-details")}
                            >
                                <IncomeDetailsSection
                                    userId={user.id}
                                    data={formState.incomeDetails}
                                    onChange={updateIncomeDetails}
                                />
                            </ProfileSectionCard>
                        )}

                        {/* Documents Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Additional Documents"
                                description="Upload remaining documents"
                                icon="upload"
                                completed={
                                    profileCompletion.sections.find((s) => s.id === "documents")
                                        ?.completed || false
                                }
                                completionPercentage={
                                    profileCompletion.sections.find((s) => s.id === "documents")
                                        ?.completionPercentage || 0
                                }
                                isExpanded={expandedSections["documents"]}
                                onToggle={() => toggleSection("documents")}
                                showCompletion={false}
                            >
                                <DocumentsSection
                                    userId={user.id}
                                    uploadedDocs={formState.documents}
                                    onChange={updateDocuments}
                                />
                            </ProfileSectionCard>
                        )}

                        {/* Rental Preference Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Rental Preference"
                                description="Your preferred locality and budget"
                                icon="map"
                                completed={
                                    profileCompletion.sections.find(
                                        (s) => s.id === "location-preferences"
                                    )?.completed || false
                                }
                                completionPercentage={
                                    profileCompletion.sections.find(
                                        (s) => s.id === "location-preferences"
                                    )?.completionPercentage || 0
                                }
                                isExpanded={expandedSections["location-preferences"]}
                                onToggle={() => toggleSection("location-preferences")}
                            >
                                <RentalPreferencesSection
                                    data={formState.rentalPreferences}
                                    onChange={updateRentalPreferences}
                                />
                            </ProfileSectionCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <DocumentOperationsProvider>
            <ProfilePageContent />
        </DocumentOperationsProvider>
    );
}

