import type { Unit } from "@/types/db";
import { formatDate } from "@/lib/utils/dateUtils";
import { parseISO } from "date-fns";
import { PARKING_OPTIONS } from "@/components/PropertyForm";

export function parseAddress(address: unknown) {
    const DEFAULT_ADDRESS = {
        address_full: "",
        address_street: "",
        address_city: "",
        address_state: "",
        address_postcode: "",
        address_country: "Australia",
    };

    const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

    const toParsedAddress = (addr: Record<string, unknown>) => {
        const street = asText(addr.street);
        const city = asText(addr.city) || asText(addr.suburb);
        const state = asText(addr.state);
        const postcode = asText(addr.postcode);
        const country = asText(addr.country) || DEFAULT_ADDRESS.address_country;
        const fullAddress = [street, city, state, postcode, country].filter(Boolean).join(", ");

        return {
            address_full: fullAddress,
            address_street: street,
            address_city: city,
            address_state: state,
            address_postcode: postcode,
            address_country: country,
        };
    };

    if (typeof address === "object" && address !== null) {
        return toParsedAddress(address as Record<string, unknown>);
    }

    if (typeof address === "string") {
        const trimmedAddress = address.trim();

        if (!trimmedAddress) {
            return DEFAULT_ADDRESS;
        }

        // Some rows may have address persisted as a JSON string.
        if (trimmedAddress.startsWith("{") && trimmedAddress.endsWith("}")) {
            try {
                const parsed = JSON.parse(trimmedAddress);
                if (parsed && typeof parsed === "object") {
                    return toParsedAddress(parsed as Record<string, unknown>);
                }
            } catch {
                // Fall through to plain text parsing.
            }
        }

        return {
            ...DEFAULT_ADDRESS,
            address_full: trimmedAddress,
        };
    }

    return DEFAULT_ADDRESS;
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
    const isAvailable = unit.status === "active";

    return {
        statusText: !isAvailable
            ? "Not Available"
            : isAvailableLater
              ? "Available"
              : "Available",
        statusColor: !isAvailable
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
