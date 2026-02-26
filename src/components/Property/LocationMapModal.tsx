"use client";

import { useMemo } from "react";
import { Icon, MapView, Modal } from "@/components/common";
import type { Property } from "@/types/db";
import { getApproximateLocation, getLocalityString } from "@/lib/utils/locationPrivacy";

export interface LocationMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    latitude: number;
    longitude: number;
    title: string;
    address?: Property["address"] | null;
}

export function LocationMapModal({
    isOpen,
    onClose,
    latitude,
    longitude,
    title,
    address,
}: LocationMapModalProps) {
    const approximateLocation = useMemo(
        () => getApproximateLocation(latitude, longitude, 0.5),
        [latitude, longitude]
    );

    const localityString = useMemo(() => getLocalityString(address ?? undefined), [address]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title ? `${title}` : "Map"} size="xl">
            <div className="space-y-3">
                {localityString && (
                    <div className="rounded-lg border border-border bg-surface-subtle p-3">
                        <div className="flex items-start gap-2">
                            <Icon name="map-pin" className="mt-0.5 h-4 w-4 text-primary-600" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-text break-words">
                                    {localityString}
                                </p>
                                <p className="mt-0.5 text-xs text-text-muted">
                                    <Icon name="info-circle" className="mr-1 inline h-3 w-3" />
                                    Approximate location. Exact address provided after enquiry
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
        </Modal>
    );
}

