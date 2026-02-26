/**
 * Profile Components Index
 * Most components are CLIENT-ONLY
 *
 * Usage:
 * import { ProfileCard, PersonalDetailsSection, useProfileForm } from "@/components/Profile";
 */

// ============================================================================
// Profile Display Components (Client-only)
// ============================================================================
export { ProfileCard } from "./ProfileCard";
export { ProfileSectionCard } from "./ProfileSectionCard";

// ============================================================================
// Profile Section Components (Client-only)
// ============================================================================
export { DocumentsSection } from "./sections/DocumentsSection";
export { RentalPreferencesSection } from "./sections/RentalPreferencesSection";
export { ResidencySection } from "./sections/ResidencySection";
export { IncomeDetailsSection } from "./sections/IncomeDetailsSection";
export { PersonalDetailsSection } from "./sections/PersonalDetailsSection";

// ============================================================================
// Profile Constants (Server & Client Safe)
// ============================================================================
export {
    DEFAULT_EXPANDED_SECTIONS,
    NATIVE_LANGUAGE_OPTIONS,
    VISA_TYPE_OPTIONS,
    EMPLOYMENT_TYPE_OPTIONS,
    FINANCE_SUPPORT_OPTIONS_STUDENT,
    FINANCE_SUPPORT_OPTIONS_NON_STUDENT,
    INCOME_FREQUENCY_OPTIONS,
} from "./constants";

// ============================================================================
// Profile Types
// ============================================================================
export type {
    PersonalDetailsFormState,
    ResidencyFormState,
    IncomeDetailsFormState,
    RentalPreferencesFormState,
    AdditionalDocumentsFormState,
    ProfileCompletionDetails,
} from "./types";

// ============================================================================
// Profile Utils (Server & Client Safe)
// ============================================================================
export {
    deepClone,
    buildShareableProfile,
} from "./utils";

// ============================================================================
// Profile Hooks (Client-only)
// ============================================================================
export {
    useDocumentManager,
    useSectionExpansion,
    useProfileForm,
    useProfileImage,
    useProfileSave,
    useAutosave,
} from "./hooks";

// ============================================================================
// Profile Completion Utils (Server & Client Safe)
// ============================================================================
export {
    calculatePersonalDetailsCompletion,
    calculateVisaDetailsCompletion,
    calculateIncomeDetailsCompletion,
    calculateAdditionalDocumentsCompletion,
    calculateLocationPreferencesCompletion,
    getProfileSections,
    calculateProfileCompletion,
    isProfileCompleteFromUser,
} from "./profile-completion";
