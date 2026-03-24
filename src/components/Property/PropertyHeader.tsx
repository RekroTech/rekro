import { useState } from "react";
import type { Property, Unit } from "@/types/db";
import { Icon } from "@/components/common";
import { getLocalityString } from "@/lib/utils";
import { LocationMapModal } from "@/components/Property";

interface PropertyHeaderProps {
    property: Property;
    selectedUnit?: Unit | null;
}

export function PropertyHeader({ property, selectedUnit }: PropertyHeaderProps) {
    const { title, property_type, bedrooms, bathrooms, car_spaces, furnished, address } = property;

    const addressText = address ? getLocalityString(address) : "Location not specified";

    // Room listings are always furnished (furniture + bills included in base rent)
    const isRoomListing = selectedUnit?.listing_type === "room";
    const isFurnished = isRoomListing || furnished;

    const hasCoordinates =
        typeof property.latitude === "number" && typeof property.longitude === "number";

    const [isMapOpen, setIsMapOpen] = useState(false);

    return (
        <div className="px-2 sm:px-0 mb-2 sm:mb-4">
            <div className="flex items-center justify-between">
                {property_type && (
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary-600 sm:text-sm">
                        {property_type}
                    </div>
                )}

                {/* Furnishing badge */}
                {isFurnished && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-success-bg px-2 py-1 text-primary-700 sm:px-2.5">
                        <Icon name="check" className="h-4 w-4" />
                        <span className="text-xs font-semibold">Furnished</span>
                    </div>
                )}
            </div>

            <div className="">
                <h1 className="min-w-0 flex-1 text-2xl font-bold leading-tight text-text sm:text-3xl sm:leading-tight md:text-4xl">
                    {title}
                </h1>
            </div>
            <div className="flex items-start justify-between gap-4 mt-2 mb-2 sm:mb-4">
                <p className="flex min-w-0 gap-2 text-sm text-text-muted sm:text-base items-center">
                    <Icon name="location" className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                    <span className="min-w-0 break-words">{addressText}</span>
                </p>

                {hasCoordinates && (
                    <button
                        type="button"
                        onClick={() => setIsMapOpen(true)}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary-500/30 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:border-primary-500/60 transition-colors"
                        aria-label="View on map"
                    >
                        <Icon name="map" className="h-3.5 w-3.5 flex-shrink-0" />
                        View on map
                    </button>
                )}
            </div>
            {hasCoordinates && (
                <LocationMapModal
                    isOpen={isMapOpen}
                    onClose={() => setIsMapOpen(false)}
                    latitude={property.latitude!}
                    longitude={property.longitude!}
                    title={property.title}
                    address={property.address}
                />
            )}

            {/* Property Features */}
            <div className="flex items-center gap-4">
                <div className="flex flex-wrap items-center gap-x-3 text-text-muted sm:gap-x-6">
                    {bedrooms !== null && bedrooms !== undefined && (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Icon
                                name="bed"
                                className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 mb-0.75"
                            />
                            <span className="text-sm font-semibold sm:text-base leading-tight">
                                {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}

                    {bathrooms !== null && bathrooms !== undefined && (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Icon
                                name="bath"
                                className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 mb-0.75"
                            />
                            <span className="text-sm font-semibold sm:text-base leading-tight">
                                {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}

                    {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Icon
                                name="car"
                                className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5 mb-0.75"
                            />
                            <span className="text-sm font-semibold sm:text-base leading-tight">
                                {car_spaces} Car{car_spaces !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}

                    {selectedUnit?.size_sqm && (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Icon
                                name="home"
                                className="h-3.5 w-3.5 flex-shrink-0 sm:h-4.5 sm:w-4.5 mb-0.5"
                            />
                            <span className="text-sm font-semibold sm:text-base leading-tight">
                            {selectedUnit.size_sqm} sqm
                        </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
