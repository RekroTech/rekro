"use client";

import { useMemo, useRef, useState } from "react";
import type { Property } from "@/types/property.types";
import { useProperties } from "@/lib/hooks";
import { MapView, Icon } from "@/components/common";
import { PropertyListSkeleton } from "@/components/common/Skeleton";
import { PropertyMapCard } from "@/components/Properties/PropertyMapCard";

export interface PropertyMapViewProps {
    search?: string;
    propertyType?: string;
    minBedrooms?: number;
    minBathrooms?: number;
    minPrice?: number;
    maxPrice?: number;
    furnished?: boolean;
    listingType?: string;
    status?: "active" | "leased" | "inactive";
}

export function PropertyMapView({
    search,
    propertyType,
    minBedrooms,
    minBathrooms,
    minPrice,
    maxPrice,
    furnished,
    listingType,
    status,
}: PropertyMapViewProps = {}) {
    const normalizedListingType =
        listingType && listingType !== "all" ? listingType : undefined;

    const { data, isLoading, isError, error } = useProperties({
        limit: 200,
        search,
        propertyType,
        minBedrooms,
        minBathrooms,
        minPrice,
        maxPrice,
        furnished,
        listingType: normalizedListingType,
        status,
    });

    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const allProperties = useMemo(
        () => data?.pages.flatMap((page: { data: Property[] }) => page.data) ?? [],
        [data]
    );

    const markers = useMemo(
        () =>
            allProperties
                .filter((p) => p.latitude != null && p.longitude != null)
                .map((p) => ({
                    id: p.id,
                    lat: p.latitude as number,
                    lng: p.longitude as number,
                    title: p.title,
                })),
        [allProperties]
    );

    // Calculate center from markers, default to Sydney
    const center = useMemo(() => {
        if (markers.length === 0) return { lat: -33.8688, lng: 151.2093 };
        const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
        const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
        return { lat: avgLat, lng: avgLng };
    }, [markers]);

    const selectedProperty = useMemo(
        () => allProperties.find((p) => p.id === selectedPropertyId) ?? null,
        [allProperties, selectedPropertyId]
    );

    /** Lat/lng of the selected marker — passed to MapView for continuous position tracking. */
    const trackedLatLng = useMemo(() => {
        const m = markers.find((mk) => mk.id === selectedPropertyId);
        return m ? { lat: m.lat, lng: m.lng } : null;
    }, [markers, selectedPropertyId]);

    /** Compute a clamped left offset so the card never overflows the container. */
    function computeCardPos(x: number, y: number, cardWidth: number) {
        const containerWidth = containerRef.current?.offsetWidth ?? 0;
        const half = cardWidth / 2;
        const left = containerWidth === 0
            ? x - half
            : Math.max(half + 4, Math.min(containerWidth - half - 4, x)) - half;
        return { left, top: Math.max(8, y - 28) };
    }

    if (isLoading) {
        return <PropertyListSkeleton count={6} />;
    }

    if (isError) {
        return (
            <div className="rounded-[var(--radius-lg)] border border-danger-500 bg-danger-50 p-6 text-center">
                <Icon name="alert-circle" className="mx-auto h-12 w-12 text-danger-500" />
                <h3 className="mt-4 text-lg font-semibold text-danger-700">Error loading map</h3>
                <p className="mt-2 text-sm text-danger-600">
                    {error?.message || "An unexpected error occurred"}
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <MapView
                center={center}
                zoom={markers.length === 1 ? 15 : 12}
                markers={markers}
                onMarkerClick={(id) => {
                    setSelectedPropertyId(id);
                    setCardPos(null); // reset until MapView emits real coords
                }}
                trackedLatLng={trackedLatLng}
                onTrackedPosition={(pos) => setCardPos(pos ? computeCardPos(pos.x, pos.y, 340) : null)}
                className="w-full rounded-xl h-[calc(100vh-320px)] min-h-[400px]"
            />
            {allProperties.length > 0 && markers.length === 0 && (
                <p className="mt-3 text-center text-sm text-text-muted">
                    Properties found, but none have map coordinates set.
                </p>
            )}

            {/* Floating property card — anchored to marker, hidden when marker leaves the map */}
            {selectedProperty && cardPos && (
                <div
                    className="absolute z-10 w-[340px] max-w-[calc(100%-2rem)] pointer-events-auto transition-[left,top] duration-75"
                    style={{
                        left: cardPos.left,
                        top: cardPos.top,
                        transform: "translateY(-100%)",
                    }}
                >
                    <PropertyMapCard
                        property={selectedProperty}
                        onClose={() => {
                            setSelectedPropertyId(null);
                            setCardPos(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
