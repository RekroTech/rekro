import { Checkbox } from "@/components/common";
import { PropertyFormData } from "../types";
import { AMENITIES, PARKING_OPTIONS } from "../constants";

interface AmenitiesSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
}

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
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <h4 className="text-sm text-text-muted mb-3">Amenities</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {AMENITIES.map((amenity) => (
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
