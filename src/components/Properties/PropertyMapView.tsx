"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Property } from "@/types/property.types";
import { useProperties } from "@/lib/hooks";
import { MapView, Icon } from "@/components/common";
import { PropertyListSkeleton } from "@/components/common/Skeleton";
import { PropertyMapCard } from "@/components/Properties/PropertyMapCard";
import { loadGoogleMapsScript } from "@/lib/utils/googleMaps";

export interface PropertyMapViewProps {
    search?: string;
    /** When set, the map immediately flies to these coordinates (bypasses geocoding). */
    directFlyTo?: { lat: number; lng: number; zoom?: number } | null;
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
    directFlyTo,
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
        // search intentionally omitted — in map view the query navigates the map instead of filtering
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
    const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

    // Immediately fly to coords provided by the autocomplete selection
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (directFlyTo) setFlyTo({ zoom: 14, ...directFlyTo });
    }, [directFlyTo]);

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

    // Navigate the map to the searched location/property without filtering
    useEffect(() => {
        if (!search?.trim()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFlyTo(null);
            return;
        }

        const q = search.trim().toLowerCase();

        // 1. Check if any loaded property matches by title, suburb, city, street, postcode or state
        const match = allProperties.find((p) => {
            if (p.latitude == null || p.longitude == null) return false;
            const addr = p.address;
            if (!addr) return false;
            return (
                addr.suburb?.toLowerCase().includes(q) ||
                addr.city?.toLowerCase().includes(q) ||
                addr.street?.toLowerCase().includes(q) ||
                addr.postcode?.toLowerCase().includes(q) ||
                addr.state?.toLowerCase().includes(q)
            );
        });

        if (match) {
            setFlyTo({ lat: match.latitude as number, lng: match.longitude as number, zoom: 15 });
            return;
        }

        // 2. Fall back to Google Maps Geocoder — restricted to Australia for suburb/address queries
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;
        console.log("falling back to geocoding search query:", search);
        loadGoogleMapsScript(apiKey).then(() => {
            if (!window.google?.maps?.Geocoder) return;
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(
                {
                    address: search.trim(),
                    // Bias results to Australia so queries like "Mascot", "casula 2170" or "burke rd zetland" resolve correctly
                    componentRestrictions: { country: "au" },
                    region: "AU",
                },
                (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        const loc = results[0].geometry.location;
                        setFlyTo({ lat: loc.lat(), lng: loc.lng(), zoom: 14 });
                    }
                },
            );
        });
    }, [search, allProperties]);


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
                <Icon icon={AlertCircle} size={48} className="mx-auto text-danger-500" />
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
                flyTo={flyTo}
                markers={markers}
                selectedId={selectedPropertyId}
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
