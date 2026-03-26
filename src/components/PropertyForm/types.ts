import { ListingType } from "@/types/db";
import { UnitStatus } from "@/types/property.types";

export interface PropertyFormData {
    description: string;
    property_type: string;
    bedrooms: string;
    bathrooms: string;
    car_spaces: string;
    furnished: boolean;
    bills_included: boolean;
    amenities: string[];
    price: string; // Base rent for the property
    address_full: string; // Complete formatted address for display
    address_street: string;
    address_city: string;
    address_state: string;
    address_postcode: string;
    address_country: string;
    latitude?: number;
    longitude?: number;
}

export interface UnitFormData {
    id?: string; // Existing unit ID, undefined for new units
    listing_type: ListingType;
    name: string;
    unit_description: string;
    price: string;
    bond_amount: string;
    min_lease: string;
    max_lease: string;
    max_occupants: string;
    size_sqm: string;
    available_from: string;
    available_to: string;
    status: UnitStatus; // Unit status: active, leased, or inactive
    features: string[];
    availability_notes: string;
}