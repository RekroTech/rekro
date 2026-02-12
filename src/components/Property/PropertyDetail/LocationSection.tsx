"use client";

import { useState, useMemo } from "react";
import { MapView, Icon } from "@/components/common";
import type { Property } from "@/types/property.types";
import { getApproximateLocation, getLocalityString } from "@/lib/utils/locationPrivacy";

interface LocationSectionProps {
    latitude: number;
    longitude: number;
    title: string;
    address?: Property["address"];
}

export function LocationSection({ latitude, longitude, address }: LocationSectionProps) {
    const [showMap, setShowMap] = useState(false);

    // Generate approximate location (adds offset within radius)
    const approximateLocation = useMemo(
        () => getApproximateLocation(latitude, longitude, 0.5),
        [latitude, longitude]
    );

    // Get locality string (suburb/city + state only, no street address)
    const localityString = useMemo(() => getLocalityString(address ?? undefined), [address]);

    return (
        <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Location</h2>
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                {/* Locality Information (Privacy Protected) */}
                {localityString && (
                    <div className="p-3 sm:p-4 border-b border-border bg-surface-subtle">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <Icon
                                    name="map-pin"
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm sm:text-base font-medium text-text">
                                    {localityString}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    <Icon name="info-circle" className="w-3 h-3 inline mr-1" />
                                    Approximate location for privacy
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map Toggle Area */}
                {!showMap ? (
                    <button
                        onClick={() => setShowMap(true)}
                        className="w-full p-4 sm:p-6 flex items-center justify-center gap-3 hover:bg-surface-muted transition-colors group touch-manipulation active:scale-[0.99]"
                    >
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
                            <Icon name="location" className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-sm sm:text-base font-semibold text-text group-hover:text-primary-600 transition-colors">
                                View location on map
                            </p>
                            <p className="text-xs sm:text-sm text-text-muted">
                                Click to load interactive map
                            </p>
                        </div>
                        <Icon
                            name="chevron-right"
                            className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted group-hover:text-primary-600 transition-colors"
                        />
                    </button>
                ) : (
                    <div className="relative">
                        {/* Collapse Button */}
                        <button
                            onClick={() => setShowMap(false)}
                            className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-card hover:bg-surface-muted text-text-muted hover:text-text rounded-full p-1.5 sm:p-2 shadow-md transition-all border border-border touch-manipulation active:scale-95"
                            aria-label="Hide map"
                        >
                            <Icon name="x" className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        {/* Map Component */}
                        <div className="p-3 sm:p-4">
                            <div className="mb-2 sm:mb-3 px-1 sm:px-2">
                                <p className="text-xs text-text-muted flex items-center gap-1">
                                    <Icon name="info-circle" className="w-3.5 h-3.5" />
                                    Shaded area shows general locality. Exact address provided after
                                    enquiry.
                                </p>
                            </div>
                            <MapView
                                center={approximateLocation}
                                zoom={14}
                                circles={[
                                    {
                                        lat: approximateLocation.lat,
                                        lng: approximateLocation.lng,
                                        radiusMeters: 500,
                                        fillColor: "#6366F1",
                                        strokeColor: "#4F46E5",
                                        fillOpacity: 0.2,
                                        strokeOpacity: 0.4,
                                        strokeWeight: 2,
                                    },
                                ]}
                                className="h-96 w-full rounded-lg"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
