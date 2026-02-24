import { Property } from "@/types/db";
import type { Unit } from "@/types/db";
import { Icon } from "@/components/common";
import { getLocalityString } from "@/lib/utils/locationPrivacy";
import { useState } from "react";
import { LocationMapModal } from "@/components/Property/PropertyDetail";

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
            {property_type && (
                <div className="text-xs font-semibold uppercase tracking-wide text-primary-600 sm:text-sm">
                    {property_type}
                </div>
            )}

            <div className="">
                <h1 className="min-w-0 flex-1 text-2xl font-bold leading-tight text-text sm:text-3xl sm:leading-tight md:text-4xl">
                    {title}
                </h1>
            </div>
            <div className="flex justify-between sm:justify-normal gap-6 mt-2">
                <p className="mb-2 flex min-w-0 gap-2 text-sm text-text-muted sm:mb-4 sm:text-base items-center">
                    <Icon name="location" className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                    <span className="min-w-0 break-words">{addressText}</span>

                    {hasCoordinates && (
                        <button
                            type="button"
                            onClick={() => setIsMapOpen(true)}
                            className="ml-1 inline-flex flex-shrink-0 items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                            aria-label="Open map"
                            title="View on map"
                        >
                            View Map
                        </button>
                    )}
                </p>

                {selectedUnit?.size_sqm && (
                    <div className="flex sm:hidden items-center gap-1 sm:gap-2 bg-surface-muted rounded-md px-2 py-1 self-start">
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

            {/* Property Features with Furnished Badge */}
            <div className="flex items-center justify-between gap-4">
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
                        <div className="hidden sm:flex items-center gap-1 sm:gap-2">
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

                {/* Furnishing badge */}
                {(isFurnished || furnished !== null) && (
                    <div className="flex-shrink-0 self-end">
                        {isFurnished ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-success-bg px-2 py-1 text-primary-700 sm:px-2.5">
                                <Icon name="check" className="h-4 w-4" />
                                <span className="text-xs font-semibold">Furnished</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2 py-1 text-text-muted sm:px-2.5">
                                <Icon name="x" className="h-4 w-4" />
                                <span className="text-xs font-semibold">Unfurnished</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
