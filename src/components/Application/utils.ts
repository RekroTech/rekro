import type { Property } from "@/types/property.types";
import type { Application, OccupancyType, Unit } from "@/types/db";
import { getMinStartDate, RentalFormData } from "@/components/Property";

/**
 * Get formatted property type display text
 */
export const getPropertyTypeDisplay = (property: Property, selectedUnit: Unit): string => {
    const propertyType = property.property_type || "Property";
    const listingType = selectedUnit?.listing_type;

    if (listingType === "room") {
        return `Room in ${propertyType}`;
    }
    return propertyType;
};

/**
 * Format date to locale string
 */
export const formatDate = (date: string | null | undefined): string | undefined => {
    if (!date) return undefined;
    return new Date(date).toLocaleDateString();
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number | null | undefined, frequency?: string): string | undefined => {
    if (amount === null || amount === undefined) return undefined;

    let formatted = `$${amount.toLocaleString()}`;
    if (frequency) {
        formatted += ` / ${frequency}`;
    }
    return formatted;
};

/**
 * Replace underscores with spaces and capitalize
 */
export const formatEnumValue = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    return value.replace(/_/g, " ");
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = (user: {
    user_application_profile: unknown;
    phone: string | null;
    date_of_birth: string | null;
}): boolean => {
    return Boolean(user.user_application_profile && user.phone && user.date_of_birth);
};

export function getDefaultInclusions(isEntireHome: boolean): RentalFormData["inclusions"] {
    return {
        furniture: { selected: !isEntireHome, price: 0 },
        bills: { selected: !isEntireHome, price: 0 },
        cleaning: { selected: false, price: 0 },
        carpark: { selected: false, price: 0 },
        storage: { selected: false, price: 0 },
    };
}

export function normalizeOccupancyType(occupancyType: OccupancyType, selectedUnit: Unit | null): OccupancyType {
    if (!selectedUnit) return occupancyType;

    const canBeDual = selectedUnit.listing_type !== "entire_home" && selectedUnit.max_occupants === 2;
    if (!canBeDual && occupancyType === "dual") return "single";

    return occupancyType;
}

export function buildInitialFormData(selectedUnit: Unit | null): RentalFormData {
    const isEntireHome = selectedUnit?.listing_type === "entire_home";

    return {
        moveInDate: getMinStartDate(selectedUnit?.available_from),
        rentalDuration: 12,
        occupancyType: normalizeOccupancyType("single", selectedUnit),
        inclusions: getDefaultInclusions(Boolean(isEntireHome)),
        message: "",
        proposedRent: "",
    };
}

/**
 * Convert an existing Application to RentalFormData for pre-filling the form
 */
export function toFormData(app: Application): RentalFormData {
    return {
        moveInDate: app.move_in_date || "",
        rentalDuration: app.rental_duration || 12,
        occupancyType: app.occupancy_type || "single",
        inclusions: app.inclusions || {},
        message: app.message || "",
        proposedRent: app.proposed_rent?.toString() || "",
    };
}