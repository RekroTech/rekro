import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";

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

