"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Icon, Modal, Loader } from "@/components/common";
import { getLocalityString } from "@/lib/utils/locationPrivacy";
import type { Property } from "@/types/db";

// Lazy load MapView to defer Google Maps API loading (~500KB)
const MapView = dynamic(() => import("@/components/common/MapView").then(mod => ({ default: mod.MapView })), {
    loading: () => (
        <div className="h-96 w-full rounded-lg bg-surface-muted flex items-center justify-center">
            <Loader size="md" />
        </div>
    ),
    ssr: false,
});

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
    const exactLocation = useMemo(
        () => ({ lat: latitude, lng: longitude }),
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
                            </div>
                        </div>
                    </div>
                )}

                <MapView
                    center={exactLocation}
                    zoom={16}
                    markers={[
                        {
                            lat: exactLocation.lat,
                            lng: exactLocation.lng,
                            title: title,
                        },
                    ]}
                    className="h-96 w-full rounded-lg"
                />
            </div>
        </Modal>
    );
}

