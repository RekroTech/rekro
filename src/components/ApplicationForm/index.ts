/**
 * Application Form Components Index
 * All components are CLIENT-ONLY
 *
 * Usage:
 * import { ApplicationForm, ApplicationModal, getPropertyTypeDisplay } from "@/components/ApplicationForm";
 */

// ============================================================================
// Application Form Components (Client-only)
// ============================================================================
export { ApplicationForm } from "./ApplicationForm";
export { ApplicationModal } from "./ApplicationModal";
export { ApplicationConfirm } from "./ApplicationConfirm";

// ============================================================================
// Application Form Utils (Server & Client Safe)
// ============================================================================
export {
    getPropertyTypeDisplay,
    formatCurrency,
    formatEnumValue,
    isProfileComplete,
    getDefaultInclusions,
    normalizeOccupancyType,
    buildInitialFormData,
    toFormData,
} from "./utils";

// ============================================================================
// Application Form Types
// ============================================================================
export type { ModalActionState, ModalStep } from "./types";
