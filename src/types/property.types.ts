import { Property as BaseProperty, Unit } from "@/types/db";

/**
 * Inclusion types for rental properties
 */
export type InclusionType = "furniture" | "bills" | "cleaning" | "carpark" | "storage";

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
    userId?: string; // For fetching likes
    likedOnly?: boolean; // Filter to show only liked properties (requires userId)
    // New optional filters
    search?: string;
    propertyType?: string;
    minBedrooms?: number;
    minBathrooms?: number;
    furnished?: boolean;
    listingType?: string;
    status?: "active" | "leased" | "inactive"; // Admin-only filter
}

export interface GetPropertiesResponse {
    data: Property[];
    nextOffset: number | null;
    hasMore: boolean;
}
