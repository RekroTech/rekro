import type { Property } from "@/types/property.types";
import { PropertyFormData } from "./types";
import { DEFAULT_FORM_DATA } from "./constants";
import { parseAddress } from "@/components/Property/utils";

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