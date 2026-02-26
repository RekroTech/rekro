import type { Unit } from "@/types/db";
import { formatDate } from "@/lib/utils/dateUtils";
import { parseISO } from "date-fns";
import { PARKING_OPTIONS } from "@/components/PropertyForm";

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
