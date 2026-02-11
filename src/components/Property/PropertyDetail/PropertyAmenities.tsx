import { Icon, type IconName } from "@/components/common";
import { PARKING_OPTIONS } from "@/components/Property/constants";

interface PropertyAmenitiesProps {
    amenities: string[] | null;
}

// Direct mapping of predefined amenities to their icons
const AMENITY_ICON_MAP: Record<string, IconName> = {
    "Air Conditioning": "aircon",
    Heating: "heating",
    "Wi-Fi": "wifi",
    Pool: "pool",
    Gym: "gym",
    Laundry: "laundry",
    Dishwasher: "dishwasher",
    Balcony: "balcony",
    Garden: "garden",
    "Pet Friendly": "check",
    "Security System": "check",
    "BBQ Area": "check",
    "Study Room": "check",
    Storage: "check",
    Elevator: "check",
} as const;

function getAmenityIcon(amenity: string): IconName {
    // Check if it's a parking option
    if (PARKING_OPTIONS.some((parking) => amenity.toLowerCase().includes(parking.toLowerCase()))) {
        return "parking";
    }

    // Return the mapped icon or default
    return AMENITY_ICON_MAP[amenity] || "check";
}

function isParkingAmenity(amenity: string): boolean {
    return PARKING_OPTIONS.some((parking) => amenity.toLowerCase().includes(parking.toLowerCase()));
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
    if (!amenities || amenities.length === 0) {
        return null;
    }

    // Separate parking features from other amenities
    const parkingAmenities = amenities.filter(isParkingAmenity);
    const otherAmenities = amenities.filter((amenity) => !isParkingAmenity(amenity));

    // Combine parking features into a descriptive phrase
    const parkingDescription =
        parkingAmenities.length > 0 ? parkingAmenities.join(", ") + " Parking" : "";

    // Prepare amenities list for grid
    const amenitiesList = parkingDescription
        ? [parkingDescription, ...otherAmenities]
        : otherAmenities;

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Amenities Section (including synthesized parking description) */}
            {amenitiesList.length > 0 && (
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-text mb-3 sm:mb-4">
                        Amenities
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {amenitiesList.map((amenity: string, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 sm:gap-3 text-text group"
                            >
                                <div className="text-primary-600 group-hover:text-primary-700 transition-colors flex-shrink-0">
                                    <Icon
                                        name={
                                            index === 0 && parkingDescription
                                                ? "parking"
                                                : getAmenityIcon(amenity)
                                        }
                                        className="w-4 h-4 sm:w-5 sm:h-5"
                                    />
                                </div>
                                <span className="text-xs sm:text-sm md:text-base leading-snug">
                                    {amenity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
