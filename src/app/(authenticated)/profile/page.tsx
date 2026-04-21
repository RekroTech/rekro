"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { useProfile } from "@/lib/hooks";
import { Icon, Loader, BackButton } from "@/components/common";
import {
    ProfileCard,
    ProfileSectionCard,
    DocumentsSection,
    RentalPreferencesSection,
    ResidencySection,
    IncomeDetailsSection,
    PersonalDetailsSection,
    useProfileImage,
    useProfileSave,
    useAutosave,
    useSectionExpansion,
    useProfileForm,
    usePhoneVerificationFlow,
    buildShareableProfile,
    type PhoneVerificationViewmodel,
} from "@/components/Profile";
import {
    DocumentOperationsProvider,
    useDocumentOperations,
    useProfileCompletion,
} from "@/contexts";
import { useToast } from "@/hooks";

function ProfilePageContent() {
    // Data fetching
    const { data: user, isLoading: userLoading, refetch: refetchUser } = useProfile();
    const { showError } = useToast();

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
        dirtySectionIds,
    } = useProfileForm(user);

    const [savingSectionIds, setSavingSectionIds] = useState<Set<string>>(new Set());

    // Profile image upload
    const { uploadImage, isUploading: isUploadingImage } = useProfileImage({
        userId: user?.id,
    });

    // Document operations state from context
    const { isAnyOperationInProgress: isAnyDocumentOperationInProgress } = useDocumentOperations();

    // Save operations
    const { saveProfileAsync, isSaving } = useProfileSave({
        onError: showError,
    });

    // Autosave with debouncing
    useAutosave({
        formState,
        hasChanges,
        onSave: async (state) => {
            const sectionsBeingSaved = new Set(dirtySectionIds);
            setSavingSectionIds(sectionsBeingSaved);

            try {
                await saveProfileAsync(state);
                commitBaseline();
            } finally {
                setSavingSectionIds(new Set());
            }
        },
        isSaving,
        isUploadingImage,
        isAnyDocumentOperationInProgress,
        debounceMs: 1500, // Save after 1.5 seconds of inactivity
    });

    // Section expansion state
    const { expandedSections, toggleSection, collapseAll } = useSectionExpansion();

    // Phone verification flow management
    const handlePhoneVerified = useCallback(async () => {
        try {
            await refetchUser();
        } catch {
            // Keep optimistic verification and allow a later refetch to reconcile.
        }
    }, [refetchUser]);

    // Profile completion from context
    const { calculateWithFormState } = useProfileCompletion();

    const {
        isVerified: isCurrentPhoneVerified,
        verifiedAt: phoneVerifiedAtForUi,
        isValid: isCurrentPhoneValid,
        handleVerified: handleVerifiedPhone,
    } = usePhoneVerificationFlow({
        phone: formState.personalDetails.phone,
        persistedPhone: user?.phone,
        persistedPhoneVerifiedAt: user?.phone_verified_at,
        onPhoneVerified: handlePhoneVerified,
    });

    // Build derived data - calculate with current form state for real-time updates
    const profileCompletion = calculateWithFormState(
        {
            ...formState.incomeDetails,
            ...formState.residency,
            phoneVerifiedAt: phoneVerifiedAtForUi,
        },
        formState.documents
    );
    const profileCompletionIfPhoneVerified = calculateWithFormState(
        {
            ...formState.incomeDetails,
            ...formState.residency,
            phoneVerifiedAt: new Date(0).toISOString(),
        },
        formState.documents
    );
    const shouldAutoPromptPhoneVerification =
        !isCurrentPhoneVerified
        &&
        isCurrentPhoneValid
        && !profileCompletion.isComplete
        && profileCompletionIfPhoneVerified.isComplete;

    const phoneVerification: PhoneVerificationViewmodel = {
        isVerified: isCurrentPhoneVerified,
        verifiedAt: phoneVerifiedAtForUi,
        isValid: isCurrentPhoneValid,
        shouldAutoOpen: shouldAutoPromptPhoneVerification,
        handleVerified: handleVerifiedPhone,
    };

    const shareableProfile = user ? buildShareableProfile(user, formState) : null;

    // Auto-open section when phone verification should be prompted
    useEffect(() => {
        if (!phoneVerification.shouldAutoOpen) return;
        if (!expandedSections["personal-details"]) {
            toggleSection("personal-details");
        }
    }, [
        phoneVerification.shouldAutoOpen,
        expandedSections,
        toggleSection,
    ]);

    // Collapse all sections when profile is complete
    useEffect(() => {
        if (profileCompletion.isComplete) {
            collapseAll();
        }
    }, [profileCompletion.isComplete, collapseAll]);

    // Keep the page stable while the profile query resolves.
    if (userLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }

    // Auth is enforced by the server layout for this route group.
    if (!user) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }

    return (
        <div className="h-full bg-app-bg flex flex-col">
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <BackButton className="mb-4 sm:mb-6" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 pb-8">
                        {/* Left Column - Shareable Profile Card and Badges (Sticky on Desktop) */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-6 space-y-4 sm:space-y-6">
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
                                    <div className="bg-card rounded-2xl shadow-lg border border-border p-4 sm:p-6">
                                        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                                            <Icon
                                                icon={Star}
                                                size={20}
                                                className="text-yellow-500 dark:text-yellow-400"
                                            />
                                            Your Badges
                                        </h3>
                                        <div className="space-y-2">
                                            {profileCompletion.unlockedBadges.map((badge) => (
                                                <div
                                                    key={badge}
                                                    className="flex items-center gap-3 p-3 bg-linear-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg"
                                                >
                                                    <Icon
                                                        icon={CheckCircle2}
                                                        size={20}
                                                        className="text-yellow-600 dark:text-yellow-400"
                                                    />
                                                    <span className="text-sm font-medium text-text">
                                                        {badge}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Profile Sections (Scrollable) */}
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            {/* Personal Details Section */}
                            <ProfileSectionCard
                                title="Personal Details"
                                description="Basic information about you"
                                icon="profile"
                                completed={
                                    profileCompletion.sections.find(
                                        (s) => s.id === "personal-details"
                                    )?.completed || false
                                }
                                completionPercentage={
                                    profileCompletion.sections.find(
                                        (s) => s.id === "personal-details"
                                    )?.completionPercentage || 0
                                }
                                isExpanded={expandedSections["personal-details"]}
                                onToggle={() => toggleSection("personal-details")}
                                isSaving={isSaving && savingSectionIds.has("personal-details")}
                            >
                                <PersonalDetailsSection
                                    userEmail={user.email || ""}
                                    value={formState.personalDetails}
                                    onChange={updatePersonalDetails}
                                    phoneVerification={phoneVerification}
                                />
                            </ProfileSectionCard>

                            {/* Residency Section */}
                            <ProfileSectionCard
                                title="Residency"
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
                                isSaving={isSaving && savingSectionIds.has("visa-details")}
                            >
                                <ResidencySection
                                    userId={user.id}
                                    data={formState.residency}
                                    onChange={updateResidency}
                                />
                            </ProfileSectionCard>

                            {/* Income Details Section */}
                            <ProfileSectionCard
                                title="Financial Information"
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
                                isSaving={isSaving && savingSectionIds.has("income-details")}
                            >
                                <IncomeDetailsSection
                                    userId={user.id}
                                    data={formState.incomeDetails}
                                    onChange={updateIncomeDetails}
                                />
                            </ProfileSectionCard>

                            {/* Documents Section */}
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
                                isSaving={isSaving && savingSectionIds.has("documents")}
                            >
                                <DocumentsSection
                                    userId={user.id}
                                    uploadedDocs={formState.documents}
                                    onChange={updateDocuments}
                                />
                            </ProfileSectionCard>

                            {/* Rental Preference Section */}
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
                                showCompletion={false}
                                isSaving={isSaving && savingSectionIds.has("location-preferences")}
                            >
                                <RentalPreferencesSection
                                    data={formState.rentalPreferences}
                                    onChange={updateRentalPreferences}
                                />
                            </ProfileSectionCard>
                        </div>
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
