import { Property } from "@/types/property.types";

export interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    property?: Property;
}

export interface PropertyFormData {
    title: string;
    description: string;
    property_type: string;
    bedrooms: string;
    bathrooms: string;
    car_spaces: string;
    furnished: boolean;
    amenities: string[];
    address_street: string;
    address_city: string;
    address_state: string;
    address_postcode: string;
    address_country: string;
}

export interface UnitFormData {
    id?: string; // Existing unit ID, undefined for new units
    listing_type: "entire_home" | "room";
    name: string;
    unit_description: string;
    price_per_week: string;
    bond_amount: string;
    bills_included: boolean;
    min_lease: string;
    max_lease: string;
    max_occupants: string;
    size_sqm: string;
    available_from: string;
    available_to: string;
    is_available: boolean;
    availability_notes: string;
}

export type FurniturePaymentOption = "add_to_rent" | "pay_total" | null;
