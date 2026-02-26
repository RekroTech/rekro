import { Property, Inclusions } from "@/types/property.types";
import { OccupancyType } from "@/types/db";

export interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    property?: Property;
}

export interface RentalFormData {
    moveInDate: string;
    rentalDuration: number;
    inclusions: Inclusions;
    occupancyType: OccupancyType;
    message: string;
    proposedRent: string;
    totalRent: number; // Calculated total rent including all inclusions
}
