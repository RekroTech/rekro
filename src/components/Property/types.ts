import { Property } from "@/types/property.types";
import { ListingType } from "@/types/db";

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

export interface InclusionsData {
    furnitureSelected: boolean;
    billsIncluded: boolean;
    regularCleaningSelected: boolean;
    selectedLease: number;
    selectedStartDate: string;
    isDualOccupancy: boolean;
    entireHomeOccupants: number;
    carparkSelected: boolean;
    storageCageSelected: boolean;
    // Map of unit ID to selected occupancy (1 or 2)
    unitOccupancies?: Record<string, number>;
}
