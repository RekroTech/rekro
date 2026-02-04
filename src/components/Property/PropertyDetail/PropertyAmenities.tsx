interface PropertyAmenitiesProps {
    amenities: string[] | null;
}
export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
    if (!amenities || amenities.length === 0) {
        return null;
    }
    return (
        <div>
            <h2 className="text-2xl font-bold text-text mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-text-muted">
                        <svg
                            className="w-5 h-5 text-primary-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>{amenity}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
