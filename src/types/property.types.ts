import { Property as BaseProperty, Unit } from "@/types/db";

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
}

export interface GetPropertiesResponse {
    data: Property[];
    nextOffset: number | null;
    hasMore: boolean;
}
