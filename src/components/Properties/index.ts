/**
 * Properties Components Index
 * All components are CLIENT-ONLY
 *
 * Usage:
 * import { PropertyCard, PropertyList, usePropertyFilters } from "@/components/Properties";
 */

// ============================================================================
// Properties Display Components (Client-only)
// ============================================================================
export { PropertyCard } from "./PropertyCard";
export { PropertyMapCard } from "./PropertyMapCard";
export { PropertyList } from "./PropertyList";
export { PropertyMapView } from "./PropertyMapView";
export { FilterDropdown } from "./FilterDropdown";
export type { FilterValues } from "./FilterDropdown";

// ============================================================================
// Properties Hooks (Client-only)
// ============================================================================
export { usePropertyFilters } from "./hooks";
export type { PropertyFilters } from "./hooks";
