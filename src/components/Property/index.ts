/**
 * Property Components Index
 * Most components are CLIENT-ONLY
 *
 * Usage:
 * import { PropertyHeader, PropertySidebar, usePropertyShare } from "@/components/Property";
 */

// ============================================================================
// Property Display Components (Client-only)
// ============================================================================
export { PropertyHeader } from "./PropertyHeader";
export { UnitsSelector } from "./UnitsSelector";
export { ImageGallery } from "./ImageGallery";
export { ImageGallery as ImageGalleryMobile } from "./ImageGalleryMobile";
export { PropertyAmenities } from "./PropertyAmenities";
export { LikedUsersCarousal } from "./LikedUsersCarousal";
export { DiscoverabilityPrompt } from "./DiscoverabilityPrompt";

// ============================================================================
// Property Sidebar Components (Client-only)
// ============================================================================
export { PropertySidebar } from "./PropertySidebar/PropertySidebar";
export { EnquiryForm } from "./PropertySidebar/EnquiryForm";
export { ShareDropdown } from "./PropertySidebar/ShareDropdown";

// ============================================================================
// Property Modal Components (Client-only)
// ============================================================================
export { LocationMapModal } from "./LocationMapModal";

// ============================================================================
// Inclusions Components (Client-only)
// ============================================================================
export { Inclusions } from "./Inclusions/Inclusions";

// ============================================================================
// Property Types
// ============================================================================
export type { AddPropertyModalProps, RentalFormData } from "./types";

// ============================================================================
// Property Utils (Server & Client Safe)
// ============================================================================
export { parseAddress, getAvailabilityInfo, hasCarpark, hasStorage } from "./utils";

// ============================================================================
// Property Hooks (Client-only)
// ============================================================================
export { useShareProperty, usePricing, useRentalForm, usePricingSync } from "./hooks";
