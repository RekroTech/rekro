import { Property } from "@/types/db";

interface PropertyHeaderProps {
    property: Property;
    isLiked: boolean;
    onToggleLike: () => void;
    isPending: boolean;
}

export function PropertyHeader({
    property,
    isLiked,
    onToggleLike,
    isPending,
}: PropertyHeaderProps) {
    const { title, property_type, bedrooms, bathrooms, car_spaces, furnished, address } = property;

    const addressText =
        address !== null
            ? Object.values(address).filter(Boolean).join(", ")
            : "Location not specified";

    return (
        <div className="mb-6">
            {property_type && (
                <div className="text-sm font-semibold text-primary-600 uppercase mb-2">
                    {property_type}
                </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-text flex-1">{title}</h1>

                <button
                    onClick={onToggleLike}
                    disabled={isPending}
                    className={`flex-shrink-0 p-3 rounded-full transition-all ${
                        isLiked
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500"
                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label={isLiked ? "Unsave property" : "Save property"}
                >
                    <svg
                        className="w-6 h-6"
                        fill={isLiked ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth={isLiked ? 0 : 2}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                </button>
            </div>

            <p className="text-lg text-text-muted flex items-center gap-2 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                {addressText}
            </p>

            {/* Property Features */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-text-muted">
                {bedrooms !== null && bedrooms !== undefined && (
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5 md:w-6 md:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        <span className="text-base md:text-lg font-semibold">
                            {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {bathrooms !== null && bathrooms !== undefined && (
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5 md:w-6 md:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                            />
                        </svg>
                        <span className="text-base md:text-lg font-semibold">
                            {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5 md:w-6 md:h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7v10M8 7l-3 3m3-3l3 3m10 4v-8a4 4 0 00-4-4H6a4 4 0 00-4 4v8"
                            />
                        </svg>
                        <span className="text-base md:text-lg font-semibold">
                            {car_spaces} Car{car_spaces !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {furnished && (
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-5 h-5 md:w-6 md:h-6"
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
                        <span className="text-base md:text-lg font-semibold">Furnished</span>
                    </div>
                )}
            </div>
        </div>
    );
}
