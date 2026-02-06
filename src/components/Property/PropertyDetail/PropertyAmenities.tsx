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
        normalized.includes("carport")
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

    return (
        <div>
            <h2 className="text-2xl font-bold text-text mb-6">Amenities</h2>
            <div className="flex flex-row gap-x-6 gap-y-4">
                {amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-text group">
                        <div className="text-primary-600 group-hover:text-primary-700 transition-colors flex-shrink-0">
                            <Icon name={getAmenityIcon(amenity)} className="w-5 h-5" />
                        </div>
                        <span className="text-sm md:text-base leading-snug">{amenity}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
