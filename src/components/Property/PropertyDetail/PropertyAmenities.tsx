import React from "react";

interface PropertyAmenitiesProps {
    amenities: string[] | null;
}

// Icon mapping for common amenities
const amenityIcons: Record<string, React.ReactElement> = {
    wifi: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
        </svg>
    ),
    parking: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
        </svg>
    ),
    pool: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
        </svg>
    ),
    gym: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
            />
        </svg>
    ),
    aircon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
            />
        </svg>
    ),
    heating: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 8v8m-4-4h8"
            />
        </svg>
    ),
    laundry: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
        </svg>
    ),
    dishwasher: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
        </svg>
    ),
    balcony: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
        </svg>
    ),
    garden: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
        </svg>
    ),
    default: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
};

function getAmenityIcon(amenity: string): React.ReactElement {
    const normalized = amenity.toLowerCase().trim();

    // Check for common patterns
    if (normalized.includes("wifi") || normalized.includes("internet")) return amenityIcons.wifi;
    if (
        normalized.includes("parking") ||
        normalized.includes("garage") ||
        normalized.includes("carport")
    )
        return amenityIcons.parking;
    if (normalized.includes("pool") || normalized.includes("swimming")) return amenityIcons.pool;
    if (normalized.includes("gym") || normalized.includes("fitness")) return amenityIcons.gym;
    if (normalized.includes("air") || normalized.includes("cooling") || normalized.includes("ac"))
        return amenityIcons.aircon;
    if (normalized.includes("heat")) return amenityIcons.heating;
    if (normalized.includes("laundry") || normalized.includes("washing"))
        return amenityIcons.laundry;
    if (normalized.includes("dishwasher")) return amenityIcons.dishwasher;
    if (
        normalized.includes("balcony") ||
        normalized.includes("patio") ||
        normalized.includes("terrace")
    )
        return amenityIcons.balcony;
    if (normalized.includes("garden") || normalized.includes("yard")) return amenityIcons.garden;

    return amenityIcons.default;
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
                            {getAmenityIcon(amenity)}
                        </div>
                        <span className="text-sm md:text-base leading-snug">{amenity}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
