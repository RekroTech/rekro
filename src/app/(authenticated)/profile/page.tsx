"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useProfile } from "@/lib/react-query/hooks/user";
import * as profileHooks from "@/lib/react-query/hooks/user/useProfile";
import { Icon, Loader } from "@/components/common";
import {
  ProfileCard,
  ProfileSectionCard,
  DocumentsSection,
  RentalPreferencesSection,
  ResidencySection,
  IncomeDetailsSection,
  PersonalDetailsSection,
} from "@/components/Profile";
import { useRouter } from "next/navigation";
import type { Gender, PreferredContactMethod, ShareableProfile, EmploymentStatus } from "@/types/user.types";
import type { PersonalDetailsFormState, ResidencyFormState, IncomeDetailsFormState, RentalPreferencesFormState } from "@/components/Profile";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";
import { Button } from "@/components/common";

export default function ProfilePage() {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useProfile();
    const { mutate: updateProfile, isPending } = profileHooks.useUpdateProfile();

    // State for expanded sections
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        "personal-details": true,
        "visa-details": false,
        "income-details": false,
        "documents": false,
        "location-preferences": false,
    });

    const didHydrateFromUserRef = useRef(false);

    const userPersonalDetails = useMemo((): PersonalDetailsFormState => {
        if (!user) {
            return {
                full_name: "",
                username: "",
                phone: "",
                bio: "",
                occupation: "",
                date_of_birth: "",
                gender: "" as "" | Gender,
                preferred_contact_method: "email" as PreferredContactMethod,
                native_language: "",
            };
        }

        return {
            full_name: user.full_name ?? "",
            username: user.username ?? "",
            phone: user.phone ?? "",
            bio: user.bio ?? "",
            occupation: user.occupation ?? "",
            date_of_birth: user.date_of_birth ?? "",
            gender: (user.gender ?? "") as "" | Gender,
            preferred_contact_method: (user.preferred_contact_method ?? "email") as PreferredContactMethod,
            native_language: user.native_language ?? "",
        };
    }, [user]);

    const userLocationPreferences = useMemo((): RentalPreferencesFormState => {
        if (!user) {
            return {
                current_location: null,
                destination_location: null,
                max_budget_per_week: null,
                preferred_locality: null,
                has_pets: null,
                smoker: null,
            };
        }

        const app = user.user_application_profile ?? null;

        return {
            current_location: user.current_location ?? null,
            destination_location: null,
            max_budget_per_week: app?.max_budget_per_week ?? null,
            preferred_locality: app?.preferred_locality ?? null,
            has_pets: app?.has_pets ?? null,
            smoker: app?.smoker ?? null,
        };
    }, [user]);

    // State for personal details form
    const [personalDetails, setPersonalDetails] = useState<PersonalDetailsFormState>(userPersonalDetails);

    // State for income and employment details
    const [incomeDetails, setIncomeDetails] = useState<IncomeDetailsFormState>({
        isWorking: null,
        isStudent: null,
        employmentStatus: null,
        incomeSource: null,
        incomeFrequency: null,
        incomeAmount: null,
        financeSupportType: null,
        financeSupportDetails: null,
    });

    // State for visa/citizenship
    const [residency, setResidency] = useState<ResidencyFormState>({
        isCitizen: null,
        visaStatus: null,
    });

    // State for location & budget
    const [locationPreferences, setLocationPreferences] = useState(userLocationPreferences);

    // State for uploaded documents (TODO: backend implementation needed)
    const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

    // Populate form with user data (once, when user is first loaded)
    useEffect(() => {
        if (!user) return;
        if (didHydrateFromUserRef.current) return;

        const app = user.user_application_profile ?? null;

        // Defer state updates to avoid synchronous setState-in-effect warnings.
        const defer = typeof queueMicrotask === "function"
            ? queueMicrotask
            : (cb: () => void) => Promise.resolve().then(cb);

        defer(() => {
            setPersonalDetails(userPersonalDetails);
            setLocationPreferences(userLocationPreferences);

            // Hydrate tenant/application details from DB
            setIncomeDetails({
                isWorking:
                    app?.employment_status === "working"
                        ? true
                        : app?.employment_status === "not_working"
                          ? false
                          : null,
                isStudent:
                    app?.student_status === "student"
                        ? true
                        : app?.student_status === "not_student"
                          ? false
                          : null,
                employmentStatus: app?.employment_status ?? null,
                incomeSource: app?.income_source ?? null,
                incomeFrequency: app?.income_frequency ?? null,
                incomeAmount: app?.income_amount ?? null,
                financeSupportType: app?.finance_support_type ?? null,
                financeSupportDetails: app?.finance_support_details ?? null,
            });

            setResidency({
                isCitizen: app?.visa_status ? false : null,
                visaStatus: app?.visa_status ?? null,
            });

            didHydrateFromUserRef.current = true;
        });
    }, [user, userPersonalDetails, userLocationPreferences]);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };


    const handleSavePersonalDetails = () => {
        const nativeLanguage = personalDetails.native_language.trim();

        updateProfile(
            {
                full_name: personalDetails.full_name.trim() || null,
                username: personalDetails.username.trim() || null,
                phone: personalDetails.phone.trim() || null,
                bio: personalDetails.bio.trim() || null,
                occupation: personalDetails.occupation.trim() || null,
                date_of_birth: personalDetails.date_of_birth || null,
                gender: personalDetails.gender || null,
                preferred_contact_method: personalDetails.preferred_contact_method,
                native_language: nativeLanguage || null,
            },
            {
                onSuccess: () => {
                    alert("Personal details updated successfully!");
                },
                onError: (error: Error) => {
                    alert(`Failed to update: ${error.message}`);
                },
            }
        );
    };

    // NOTE: Location preferences are saved via the top-level "Save Profile" button.

    const handleSaveWholeProfile = () => {
        const nativeLanguage = personalDetails.native_language.trim();

        updateProfile(
            {
                full_name: personalDetails.full_name.trim() || null,
                username: personalDetails.username.trim() || null,
                phone: personalDetails.phone.trim() || null,
                bio: personalDetails.bio.trim() || null,
                occupation: personalDetails.occupation.trim() || null,
                date_of_birth: personalDetails.date_of_birth || null,
                gender: personalDetails.gender || null,
                preferred_contact_method: personalDetails.preferred_contact_method,
                native_language: nativeLanguage || null,

                current_location: locationPreferences.current_location,

                // Application profile fields
                preferred_locality: locationPreferences.preferred_locality ?? null,
                max_budget_per_week: locationPreferences.max_budget_per_week,
                has_pets: locationPreferences.has_pets,
                smoker: locationPreferences.smoker,

                visa_status: residency.visaStatus,

                employment_status: (incomeDetails.employmentStatus as EmploymentStatus | null) ?? null,
                income_source: incomeDetails.incomeSource,
                income_frequency: incomeDetails.incomeFrequency,
                income_amount: incomeDetails.incomeAmount,
                finance_support_type: incomeDetails.financeSupportType,
                finance_support_details: incomeDetails.financeSupportDetails,

                student_status: incomeDetails.isStudent === null
                    ? null
                    : incomeDetails.isStudent
                      ? "student"
                      : "not_student",
            },
            {
                onSuccess: () => {
                    alert("Profile updated successfully!");
                },
                onError: (error: Error) => {
                    alert(`Failed to update profile: ${error.message}`);
                },
            }
        );
    };

    const handleDocumentUpload = (docType: string, file: File) => {
        // TODO: Backend implementation - upload to Supabase Storage
        console.log("Uploading document:", docType, file);
        setUploadedDocs((prev) => (prev.includes(docType) ? prev : [...prev, docType]));
        alert(`${docType} uploaded! (Backend implementation pending)`);
    };

    const handleDocumentRemove = (docType: string) => {
        // TODO: Backend implementation - remove from Supabase Storage
        setUploadedDocs((prev) => prev.filter((d) => d !== docType));
        alert(`${docType} removed!`);
    };

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

    // Calculate profile completion
    const combinedTenantDetails = {
        ...incomeDetails,
        ...residency,
    };
    const profileCompletion = calculateProfileCompletion(user, combinedTenantDetails, uploadedDocs);
    const isTenant = true;

    // Build shareable profile
    const shareableProfile: ShareableProfile = {
        fullName: user.full_name || user.email || "User",
        username: user.username ?? null,
        email: user.email || "",
        imageUrl: user.image_url ?? null,
        nativeLanguage: user.native_language ?? null,
        currentLocation: (user.current_location as { display?: string })?.display || null,
        targetLocation: null, // Not available in current schema
        budget: user.user_application_profile?.max_budget_per_week ?? null,
        completionPercentage: profileCompletion.totalPercentage,
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-600 mt-2">
                            Manage your profile and increase your chances of being accepted
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={handleSaveWholeProfile}
                        disabled={isPending}
                        loading={isPending}
                        variant="primary"
                        size="md"
                    >
                        Save Profile
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Shareable Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <ProfileCard profile={shareableProfile} />

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
                                                <Icon name="check-circle" className="w-5 h-5 text-yellow-600" />
                                                <span className="text-sm font-medium text-gray-900">{badge}</span>
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
                            completed={profileCompletion.sections.find(s => s.id === "personal-details")?.completed || false}
                            completionPercentage={profileCompletion.sections.find(s => s.id === "personal-details")?.completionPercentage || 0}
                            isExpanded={expandedSections["personal-details"]}
                            onToggle={() => toggleSection("personal-details")}
                        >
                            <PersonalDetailsSection
                                userEmail={user.email || ""}
                                value={personalDetails}
                                onChange={setPersonalDetails}
                                onSave={handleSavePersonalDetails}
                                isSaving={isPending}
                            />
                        </ProfileSectionCard>


                        {/* Visa Details Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Visa Details"
                                description="Citizenship status and visa documentation"
                                icon="map-pin"
                                completed={profileCompletion.sections.find(s => s.id === "visa-details")?.completed || false}
                                completionPercentage={profileCompletion.sections.find(s => s.id === "visa-details")?.completionPercentage || 0}
                                isExpanded={expandedSections["visa-details"]}
                                onToggle={() => toggleSection("visa-details")}
                            >
        <ResidencySection
          isCitizen={residency.isCitizen}
          visaStatus={residency.visaStatus}
          uploadedDocs={uploadedDocs}
          onCitizenChange={(isCitizen) =>
            setResidency((prev) => ({
              ...prev,
              isCitizen,
              visaStatus: isCitizen ? null : prev.visaStatus,
            }))
          }
          onVisaStatusChange={(visaStatus: string | null) =>
            setResidency((prev) => ({ ...prev, visaStatus }))
          }
          onUpload={handleDocumentUpload}
          onRemove={handleDocumentRemove}
        />
      </ProfileSectionCard>
                        )}

                        {/* Income Details Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Income Details"
                                description="Employment and financial information"
                                icon="dollar"
                                completed={profileCompletion.sections.find(s => s.id === "income-details")?.completed || false}
                                completionPercentage={profileCompletion.sections.find(s => s.id === "income-details")?.completionPercentage || 0}
                                isExpanded={expandedSections["income-details"]}
                                onToggle={() => toggleSection("income-details")}
                            >
                            <IncomeDetailsSection
                                data={incomeDetails}
                                uploadedDocs={uploadedDocs}
                                onChange={(data) => setIncomeDetails(prev => ({ ...prev, ...data }))}
                                onUpload={handleDocumentUpload}
                                onRemove={handleDocumentRemove}
                            />
                            </ProfileSectionCard>
                        )}

                        {/* Documents Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Additional Documents"
                                description="Upload remaining documents"
                                icon="upload"
                                completed={profileCompletion.sections.find(s => s.id === "documents")?.completed || false}
                                completionPercentage={profileCompletion.sections.find(s => s.id === "documents")?.completionPercentage || 0}
                                isExpanded={expandedSections["documents"]}
                                onToggle={() => toggleSection("documents")}
                            >
                            <DocumentsSection
                                uploadedDocs={uploadedDocs}
                                onUpload={handleDocumentUpload}
                                onRemove={handleDocumentRemove}
                            />
                            </ProfileSectionCard>
                        )}

                        {/* Rental Preference Section - Only for tenants */}
                        {isTenant && (
                            <ProfileSectionCard
                                title="Rental Preference"
                                description="Your preferred locality and budget"
                                icon="map"
                                completed={profileCompletion.sections.find(s => s.id === "location-preferences")?.completed || false}
                                completionPercentage={profileCompletion.sections.find(s => s.id === "location-preferences")?.completionPercentage || 0}
                                isExpanded={expandedSections["location-preferences"]}
                                onToggle={() => toggleSection("location-preferences")}
                            >
                            <RentalPreferencesSection
                                data={locationPreferences}
                                onChange={(data) => setLocationPreferences(prev => ({ ...prev, ...data }))}
                            />
                            </ProfileSectionCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
