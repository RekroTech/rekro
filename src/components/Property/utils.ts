import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { DEFAULT_FORM_DATA, PARKING_OPTIONS } from "@/components/Property/constants";
import {
    Inclusion,
    Inclusions,
    InclusionType,
    PropertyFormData,
} from "./types";
import {
    CARPARK_COST_PER_WEEK,
    FURNITURE_COST,
    STORAGE_CAGE_COST_PER_WEEK,
} from "@/components/Property/constants";
import { format, parseISO, addWeeks } from "date-fns";

export function parseAddress(address: unknown) {
    if (typeof address === "object" && address !== null) {
        const addr = address as Record<string, unknown>;
        const street = (addr.street as string) || "";
        const city = (addr.city as string) || "";
        const state = (addr.state as string) || "";
        const postcode = (addr.postcode as string) || "";
        const country = (addr.country as string) || "Australia";

        // Construct full address for display
        const fullAddress = [street, city, state, postcode, country].filter(Boolean).join(", ");

        return {
            address_full: fullAddress,
            address_street: street,
            address_city: city,
            address_state: state,
            address_postcode: postcode,
            address_country: country,
        };
    }
    return {
        address_full: "",
        address_street: "",
        address_city: "",
        address_state: "",
        address_postcode: "",
        address_country: "Australia",
    };
}

export function getInitialFormData(property?: Property): PropertyFormData {
    if (!property) {
        return DEFAULT_FORM_DATA;
    }

    return {
        title: property.title || "",
        description: property.description || "",
        property_type: property.property_type || "",
        bedrooms: property.bedrooms?.toString() || "1",
        bathrooms: property.bathrooms?.toString() || "1",
        car_spaces: property.car_spaces?.toString() || "",
        furnished: property.furnished || false,
        amenities: property.amenities || [],
        ...parseAddress(property.address),
        price: property.price?.toString() || "",
        latitude: property.latitude ?? undefined,
        longitude: property.longitude ?? undefined,
    };
}

export function isVideoFile(file: File): boolean {
    return file.type.startsWith("video/");
}

// Bills cost per week based on property bedrooms
export const getBillsCostPerWeek = (bedrooms: number | null): number => {
    if (!bedrooms) return 10;
    if (bedrooms === 1) return 20;
    if (bedrooms === 2) return 15;
    if (bedrooms === 4) return 7;
    return 10; // 3 bed or default
};

// Calculate regular cleaning cost per week for rooms (single occupancy)
export const getRegularCleaningCostPerWeek = (isDualOccupied: boolean = false): number => {
    return isDualOccupied ? 60 : 35;
};

// Calculate cleaning costs for entire homes based on individual room units only
export const getEntireHomeCleaningCosts = (
    units: Array<{ max_occupants: number | null; listing_type: string }>
) => {
    let regularWeekly = 0;
    let endOfLease = 0;

    // Only consider room-type units (individual bedrooms), not the entire_home unit
    const roomUnits = units.filter((unit) => unit.listing_type === "room");

    roomUnits.forEach((unit) => {
        const maxOccupants = unit.max_occupants || 1;
        // If max_occupants is 2, charge $60/week, otherwise $35/week
        regularWeekly += maxOccupants === 2 ? 60 : 35;
        // Each room costs $200 for end of lease cleaning
        endOfLease += 200;
    });

    return {
        regularWeekly,
        endOfLease,
    };
};

// Calculate furniture cost for individual rooms based on total room count
// For entire homes: full $1500
// For individual rooms: $1500 divided by number of rooms (e.g., $750 for 2 rooms, $500 for 3 rooms)
export const getRoomFurnitureCost = (
    units: Array<{ listing_type: string }>,
    totalFurnitureCost: number
): number => {
    // Count room-type units (individual bedrooms), not the entire_home unit
    const roomUnits = units.filter((unit) => unit.listing_type === "room");
    const roomCount = roomUnits.length;

    if (roomCount === 0) return totalFurnitureCost;

    return totalFurnitureCost / roomCount;
};

/**
 * Format date string for display (e.g., "Feb 12, 2026")
 * @param dateString - ISO date string from database
 * @returns Formatted date string or null
 */
export const formatDate = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;
    try {
        return format(parseISO(dateString), "MMM d, yyyy");
    } catch {
        return null;
    }
};

/**
 * Format date string for HTML date inputs (yyyy-MM-dd format required)
 * Database dates are already in this format, but timestamps need conversion
 * @param dateString - ISO date string or timestamp from database
 * @returns Date string in yyyy-MM-dd format, or empty string
 */
export const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
        // Parse timestamp and format to date-only
        return format(parseISO(dateString), "yyyy-MM-dd");
    } catch {
        return "";
    }
};

/**
 * Get the effective minimum start date (today or available_from, whichever is later)
 * @param availableFrom - ISO date string from database
 * @returns Date string in yyyy-MM-dd format for HTML date input
 */
export function getMinStartDate(availableFrom: string | null | undefined): string {
    const now = new Date();
    if (!availableFrom) return formatDateForInput(now.toISOString());

    const availableDate = parseISO(availableFrom);
    const minDate = availableDate > now ? availableDate : now;
    return formatDateForInput(minDate.toISOString());
}

/**
 * Get max start date (2 weeks from min start date, capped at available_to if provided)
 * @param availableFrom - ISO date string from database
 * @param availableTo - ISO date string from database (optional)
 * @returns Date string in yyyy-MM-dd format for HTML date input
 */
export function getMaxStartDate(
    availableFrom: string | null | undefined,
    availableTo: string | null | undefined
): string {
    const minDate = parseISO(getMinStartDate(availableFrom));
    const twoWeeksLater = addWeeks(minDate, 2);

    // Cap at available_to if it exists and is earlier
    if (availableTo) {
        const maxDate = parseISO(availableTo);
        return formatDateForInput(
            (maxDate < twoWeeksLater ? maxDate : twoWeeksLater).toISOString()
        );
    }

    return formatDateForInput(twoWeeksLater.toISOString());
}

/**
 * Get availability status information for display
 * @param unit - Unit object or null
 * @returns Object with status text, color, and date information
 */
export function getAvailabilityInfo(unit: Unit | null) {
    if (!unit) {
        return {
            statusText: "Available",
            statusColor: "text-gray-500",
            showFromDate: false,
            fromDate: null,
            toDate: formatDate(null),
        };
    }

    const now = new Date();
    const availableFrom = unit.available_from ? parseISO(unit.available_from) : null;
    const isAvailableLater = availableFrom && availableFrom > now;

    return {
        statusText: !unit.is_available
            ? "Not Available"
            : isAvailableLater
              ? "Available"
              : "Available",
        statusColor: !unit.is_available
            ? "text-red-600"
            : isAvailableLater
              ? "text-yellow-600"
              : "text-green-600",
        showFromDate: isAvailableLater,
        fromDate: formatDate(unit.available_from || null),
        toDate: formatDate(unit.available_to || null),
    };
}

// Amenities helpers
export const hasCarpark = (amenities: string[] | null): boolean => {
    if (!amenities) return false;
    return amenities.some((amenity) =>
        PARKING_OPTIONS.some((parking) => amenity.includes(parking))
    );
};

export const hasStorage = (amenities: string[] | null): boolean => {
    if (!amenities) return false;
    return amenities.some((amenity) => amenity.toLowerCase().includes("storage"));
};


// Helper functions for working with Inclusions (object/record)
export const getInclusionByType = (
    inclusions: Inclusions,
    type: InclusionType
): Inclusion | undefined => {
    return inclusions[type];
};

export const isInclusionSelected = (inclusions: Inclusions, type: InclusionType): boolean => {
    return inclusions[type]?.selected ?? false;
};

export const updateInclusion = (
    inclusions: Inclusions,
    type: InclusionType,
    updates: Partial<Inclusion>
): Inclusions => {
    return {
        ...inclusions,
        [type]: { ...inclusions[type], ...updates } as Inclusion,
    };
};

export function getInclusionPricePerWeek(params: {
    type: InclusionType;
    property: Property;
    isEntireHome: boolean;
    effectiveOccupancyType: "single" | "dual";
    rentalDurationMonths: number;
}): number {
    const { type, property, isEntireHome, effectiveOccupancyType, rentalDurationMonths } = params;

    switch (type) {
        case "furniture": {
            // For room listings, furniture is included (not a paid add-on)
            if (!isEntireHome) return 0;
            const months = rentalDurationMonths && rentalDurationMonths > 0 ? rentalDurationMonths : 12;
            const weekly = FURNITURE_COST / (months * 4.33);
            return Number.isFinite(weekly) ? weekly : 0;
        }
        case "bills": {
            // For room listings, bills are included (not a paid add-on)
            if (!isEntireHome) return 0;
            return getBillsCostPerWeek(property.bedrooms);
        }
        case "cleaning": {
            if (isEntireHome) {
                return getEntireHomeCleaningCosts(property.units || []).regularWeekly;
            }
            return effectiveOccupancyType === "dual" ? 60 : 35;
        }
        case "carpark":
            return isEntireHome ? 0 : CARPARK_COST_PER_WEEK;
        case "storage":
            return isEntireHome ? 0 : STORAGE_CAGE_COST_PER_WEEK;
        default:
            return 0;
    }
}

export const toggleInclusion = (inclusions: Inclusions, type: InclusionType): Inclusions => {
    const current = inclusions[type];
    return {
        ...inclusions,
        [type]: { selected: !current?.selected, price: current?.price ?? 0 },
    };
};

export function toggleInclusionWithPrice(params: {
    inclusions: Inclusions;
    type: InclusionType;
    property: Property;
    isEntireHome: boolean;
    effectiveOccupancyType: "single" | "dual";
    rentalDurationMonths: number;
}): Inclusions {
    const { inclusions, type, property, isEntireHome, effectiveOccupancyType, rentalDurationMonths } =
        params;

    const current = inclusions[type];
    const nextSelected = !(current?.selected ?? false);
    const price = nextSelected
        ? getInclusionPricePerWeek({
              type,
              property,
              isEntireHome,
              effectiveOccupancyType,
              rentalDurationMonths,
          })
        : 0;

    return {
        ...inclusions,
        [type]: { selected: nextSelected, price },
    };
}
