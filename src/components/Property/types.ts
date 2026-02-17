import { Property } from "@/types/property.types";
import { ListingType, OccupancyType } from "@/types/db";

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

export type InclusionType = "furniture" | "bills" | "cleaning" | "carpark" | "storage";

export interface Inclusion {
    selected: boolean;
    price: number;
}

export type Inclusions = Partial<Record<InclusionType, Inclusion>>;

export interface RentalFormData {
    moveInDate: string;
    rentalDuration: number;
    inclusions: Inclusions;
    occupancyType: OccupancyType;
    message: string;
    proposedRent: string;
}
