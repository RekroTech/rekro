import { Property } from "@/types/db";
import { PropertyFormData } from "./types";

export function parseAddress(address: unknown) {
    if (typeof address === "object" && address !== null) {
        const addr = address as Record<string, unknown>;
        return {
            address_street: (addr.street as string) || "",
            address_city: (addr.city as string) || "",
            address_state: (addr.state as string) || "",
            address_postcode: (addr.postcode as string) || "",
            address_country: (addr.country as string) || "Australia",
        };
    }
    return {
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
            address_street: "",
            address_city: "",
            address_state: "",
            address_postcode: "",
            address_country: "Australia",
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
    };
}

export function isVideoFile(file: File): boolean {
    return file.type.startsWith("video/");
}
