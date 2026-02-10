import { Property } from "@/types/db";
import { PropertyFormData } from "./types";

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
        return {
            title: "",
            description: "",
            property_type: "",
            bedrooms: "1",
            bathrooms: "1",
            car_spaces: "",
            furnished: false,
            amenities: [],
            address_full: "",
            address_street: "",
            address_city: "",
            address_state: "",
            address_postcode: "",
            address_country: "Australia",
            latitude: undefined,
            longitude: undefined,
        };
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
