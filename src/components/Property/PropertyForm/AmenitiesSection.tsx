import { Checkbox } from "@/components/common";
import { PropertyFormData } from "../types";

interface AmenitiesSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
}

const PARKING_OPTIONS = [
    "Garage",
    "Carport",
    "Underground",
    "Secure",
    "Street",
    "Driveway",
    "Visitor",
    "Tandem",
];

const OTHER_AMENITIES = [
    "Air Conditioning",
    "Heating",
    "Wi-Fi",
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
        <div className="space-y-6">
            {/* Parking Options Section */}
            <div>
                <h4 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                    Parking Options
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                    {PARKING_OPTIONS.map((amenity) => (
                        <Checkbox
                            key={amenity}
                            label={amenity}
                            checked={formData.amenities?.includes(amenity) || false}
                            onChange={() => handleAmenityToggle(amenity)}
                        />
                    ))}
                </div>
            </div>

            {/* Other Amenities Section */}
            <div>
                <h4 className="text-sm text-gray-500 mb-3">Amenities</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                    {OTHER_AMENITIES.map((amenity) => (
                        <Checkbox
                            key={amenity}
                            label={amenity}
                            checked={formData.amenities?.includes(amenity) || false}
                            onChange={() => handleAmenityToggle(amenity)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
