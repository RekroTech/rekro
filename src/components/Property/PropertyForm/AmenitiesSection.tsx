import { Checkbox } from "@/components/common";
import { PropertyFormData } from "../types";

interface AmenitiesSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const COMMON_AMENITIES = [
    "Air Conditioning",
    "Heating",
    "Wi-Fi",
    "Parking",
    "Pool",
    "Gym",
    "Laundry",
    "Dishwasher",
    "Balcony",
    "Garden",
    "Pet Friendly",
    "Security System",
    "BBQ Area",
    "Study Room",
    "Storage",
    "Elevator",
];

export function AmenitiesSection({ formData, updateFormData }: AmenitiesSectionProps) {
    const handleAmenityToggle = (amenity: string) => {
        const currentAmenities = formData.amenities || [];
        const newAmenities = currentAmenities.includes(amenity)
            ? currentAmenities.filter((a) => a !== amenity)
            : [...currentAmenities, amenity];
        updateFormData({ amenities: newAmenities });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Select all amenities available at this property
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                {COMMON_AMENITIES.map((amenity) => (
                    <Checkbox
                        key={amenity}
                        label={amenity}
                        checked={formData.amenities?.includes(amenity) || false}
                        onChange={() => handleAmenityToggle(amenity)}
                    />
                ))}
            </div>
        </div>
    );
}
