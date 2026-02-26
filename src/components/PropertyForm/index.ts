/**
 * Property Form Components Index
 * All components are CLIENT-ONLY
 *
 * Usage:
 * import { PropertyForm, PROPERTY_TYPES, AMENITIES } from "@/components/PropertyForm";
 */

// ============================================================================
// PropertyForm Component (Client-only)
// ============================================================================
export { PropertyForm } from "./PropertyForm";

// ============================================================================
// PropertyForm Types
// ============================================================================
export type { AddPropertyModalProps } from "../Property/types";

// ============================================================================
// PropertyForm Constants (Server & Client Safe)
// ============================================================================
export {
    PROPERTY_TYPES,
    LISTING_TYPES,
    LEASE_MONTH_OPTIONS,
    PARKING_OPTIONS,
    AMENITIES,
    DEFAULT_FORM_DATA,
    DEFAULT_UNIT_DATA,
} from "./constants";
