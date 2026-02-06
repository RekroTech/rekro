import { Property as BaseProperty, Unit as BaseUnit, UnitAvailability } from "@/types/db";

export interface Unit extends BaseUnit {
    unit_availability?: UnitAvailability[] | null;
    isLiked?: boolean;
}

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
