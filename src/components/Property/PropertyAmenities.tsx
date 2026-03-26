import { Icon } from "@/components/common";
import type { SvgIcon } from "@/components/common";
import { FlameKindling, LucideIcon } from "lucide-react";
import {
    Archive,
    ArrowUpDown,
    Building2,
    Car,
    Check,
    Dumbbell,
    Flame,
    BookOpen,
    Shield,
    Trees,
    Utensils,
    WashingMachine,
    Waves,
    Wifi,
    Wind,
    PawPrint,
} from "lucide-react";
import { PARKING_OPTIONS } from "@/components/PropertyForm";

interface PropertyAmenitiesProps {
    amenities: string[] | null;
}

const AMENITY_RENAMES: Record<string, string> = {
    Garden: "Backyard",
    Elevator: "Lift",
};

// Direct mapping of predefined amenities to their icons
const AMENITY_ICON_MAP: Record<string, LucideIcon | SvgIcon> = {
    "Air Conditioning": Wind,
    Heating: Flame,
    "Wi-Fi": Wifi,
    Pool: Waves,
    Gym: Dumbbell,
    Laundry: WashingMachine,
    Dishwasher: Utensils,
    Balcony: Building2,
    Garden: Trees,
    Backyard: Trees,
    "Pet Friendly": PawPrint,
    "Security System": Shield,
    "BBQ Area": FlameKindling,
    "Study Room": BookOpen,
    Storage: Archive,
    Elevator: ArrowUpDown,
    Lift: ArrowUpDown,
} as const;

function getDisplayAmenity(amenity: string): string {
    return AMENITY_RENAMES[amenity] || amenity;
}

function getAmenityIcon(amenity: string): LucideIcon | SvgIcon {
    // Check if it's a parking option
    if (PARKING_OPTIONS.some((parking) => amenity.toLowerCase().includes(parking.toLowerCase()))) {
        return Car;
    }

    // Return the mapped icon or default
    return AMENITY_ICON_MAP[amenity] || Check;
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {amenitiesList.map((amenity: string, index: number) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 sm:gap-3 text-text group"
                            >
                                <div className="text-primary-600 group-hover:text-primary-700 transition-colors flex-shrink-0">
                                    <Icon
                                        icon={index === 0 && parkingDescription ? Car : getAmenityIcon(amenity)}
                                        size={16}
                                    />
                                </div>
                                <span className="text-xs sm:text-sm md:text-base leading-snug">
                                    {getDisplayAmenity(amenity)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
