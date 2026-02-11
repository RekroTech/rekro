import { Icon, type IconName } from "@/components/common";

interface PropertyAmenitiesProps {
    amenities: string[] | null;
}

// Icon mapping for common amenities
const amenityIcons = {
    wifi: "wifi",
    parking: "parking",
    pool: "pool",
    gym: "gym",
    aircon: "aircon",
    heating: "heating",
    laundry: "laundry",
    dishwasher: "dishwasher",
    balcony: "balcony",
    garden: "garden",
    default: "check",
} as const;

function getAmenityIcon(amenity: string): IconName {
    const normalized = amenity.toLowerCase().trim();

    // Check for common patterns
    if (normalized.includes("wifi") || normalized.includes("internet"))
        return amenityIcons.wifi as IconName;
    if (
        normalized.includes("parking") ||
        normalized.includes("garage") ||
        normalized.includes("carport") ||
        normalized.includes("underground") ||
        normalized.includes("driveway") ||
        normalized.includes("visitor") ||
        normalized.includes("tandem")
    )
        return amenityIcons.parking as IconName;
    if (normalized.includes("pool") || normalized.includes("swimming"))
        return amenityIcons.pool as IconName;
    if (normalized.includes("gym") || normalized.includes("fitness"))
        return amenityIcons.gym as IconName;
    if (normalized.includes("air") || normalized.includes("cooling") || normalized.includes("ac"))
        return amenityIcons.aircon as IconName;
    if (normalized.includes("heat")) return amenityIcons.heating as IconName;
    if (normalized.includes("laundry") || normalized.includes("washing"))
        return amenityIcons.laundry as IconName;
    if (normalized.includes("dishwasher")) return amenityIcons.dishwasher as IconName;
    if (
        normalized.includes("balcony") ||
        normalized.includes("patio") ||
        normalized.includes("terrace")
    )
        return amenityIcons.balcony as IconName;
    if (normalized.includes("garden") || normalized.includes("yard"))
        return amenityIcons.garden as IconName;

    return amenityIcons.default as IconName;
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
    if (!amenities || amenities.length === 0) {
        return null;
    }

    // Separate parking options from other amenities
    const parkingAmenities = amenities.filter(
        (amenity) =>
            amenity.toLowerCase().includes("parking") ||
            amenity.toLowerCase().includes("garage") ||
            amenity.toLowerCase().includes("carport") ||
            amenity.toLowerCase().includes("driveway")
    );

    const otherAmenities = amenities.filter(
        (amenity) =>
            !amenity.toLowerCase().includes("parking") &&
            !amenity.toLowerCase().includes("garage") &&
            !amenity.toLowerCase().includes("carport") &&
            !amenity.toLowerCase().includes("driveway")
    );

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Parking Options Section */}
            {parkingAmenities.length > 0 && (
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-text mb-3 sm:mb-4 flex items-center gap-2">
                        Parking Options
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 sm:pl-7">
                        {parkingAmenities.map((amenity: string, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 sm:gap-3 text-text group"
                            >
                                <div className="text-primary-600 group-hover:text-primary-700 transition-colors flex-shrink-0">
                                    <Icon
                                        name={getAmenityIcon(amenity)}
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

            {/* Other Amenities Section */}
            {otherAmenities.length > 0 && (
                <div>
                    <h3 className="text-base sm:text-lg font-semibold text-text mb-3 sm:mb-4">
                        Amenities
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {otherAmenities.map((amenity: string, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 sm:gap-3 text-text group"
                            >
                                <div className="text-primary-600 group-hover:text-primary-700 transition-colors flex-shrink-0">
                                    <Icon
                                        name={getAmenityIcon(amenity)}
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
