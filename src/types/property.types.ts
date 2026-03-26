import { Property as BaseProperty, Unit } from "@/types/db";

/**
 * Inclusion types for rental properties
 */
export type InclusionType = "furniture" | "bills" | "cleaning" | "carpark" | "storage";

export type UnitStatus = "active" | "leased" | "inactive";

/**
 * Mirrors the LISTING_TYPES values — controls which price badges appear on a property card:
 * - "all"          → entire-home price + all room prices
 * - "entire_home"  → entire-home price only
 * - "room"         → room prices only
 */
export type ListingTab = "all" | "entire_home" | "room";

export interface Inclusion {
    selected: boolean;
    price: number;
}

export type Inclusions = Partial<Record<InclusionType, Inclusion>>;

/**
 * Property with detailed units (includes availability and likes)
 */
export interface Property extends BaseProperty {
    units: Unit[];
}

export interface GetPropertiesParams {
    limit?: number;
    offset?: number;
    isPublished?: boolean;
    isAdmin?: boolean;
    userId?: string; // For fetching likes
    likedOnly?: boolean; // Filter to show only liked properties (requires userId)
    // New optional filters
    search?: string;
    propertyType?: string;
    minBedrooms?: number;
    minBathrooms?: number;
    minPrice?: number;
    maxPrice?: number;
    furnished?: boolean;
    listingType?: string;
    status?: "active" | "leased" | "inactive"; // Admin-only filter
}

export interface GetPropertiesResponse {
    data: Property[];
    nextOffset: number | null;
    hasMore: boolean;
}
