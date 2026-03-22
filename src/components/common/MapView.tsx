"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { loadGoogleMapsScript } from "@/lib/utils/googleMaps";

/** Returns null if pos is outside the map div's visible area, otherwise returns pos unchanged. */
function clampToMapBounds(
    pos: { x: number; y: number } | null,
    mapDiv: HTMLDivElement | null,
): { x: number; y: number } | null {
    if (!pos || !mapDiv) return null;
    const { offsetWidth: w, offsetHeight: h } = mapDiv;
    if (pos.x < 0 || pos.x > w || pos.y < 0 || pos.y > h) return null;
    return pos;
}

/** Converts a lat/lng to pixel coordinates relative to the map div. */
function computePixelPos(
    map: google.maps.Map,
    lat: number,
    lng: number,
): { x: number; y: number } | null {
    const projection = map.getProjection();
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    if (!projection || !bounds || zoom == null) return null;

    const scale = Math.pow(2, zoom);
    const nw = new google.maps.LatLng(
        bounds.getNorthEast().lat(),
        bounds.getSouthWest().lng(),
    );
    const worldNW = projection.fromLatLngToPoint(nw);
    const worldPoint = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
    if (!worldNW || !worldPoint) return null;

    return {
        x: Math.round((worldPoint.x - worldNW.x) * scale),
        y: Math.round((worldPoint.y - worldNW.y) * scale),
    };
}

interface MapViewProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: Array<{ lat: number; lng: number; title?: string; id?: string }>;
    onMarkerClick?: (id: string) => void;
    /** Lat/lng of the marker whose pixel position should be tracked and emitted. */
    trackedLatLng?: { lat: number; lng: number } | null;
    /** Fires with updated pixel coords (relative to map div) whenever the map moves or trackedLatLng changes. */
    onTrackedPosition?: (pos: { x: number; y: number } | null) => void;
    circles?: Array<{
        lat: number;
        lng: number;
        radiusMeters: number;
        fillColor?: string;
        strokeColor?: string;
        fillOpacity?: number;
        strokeOpacity?: number;
        strokeWeight?: number;
    }>;
    onMapClick?: (lat: number, lng: number) => void;
    className?: string;
}

export function MapView({
    center = { lat: -33.8688, lng: 151.2093 }, // Default to Sydney
    zoom = 12,
    markers = [],
    circles = [],
    onMapClick,
    onMarkerClick,
    trackedLatLng,
    onTrackedPosition,
    className = "h-96 w-full rounded-lg",
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const circlesRef = useRef<google.maps.Circle[]>([]);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // Keep refs fresh to avoid stale closures inside map event listeners
    const trackedLatLngRef = useRef<{ lat: number; lng: number } | null>(null);
    const onTrackedPositionRef = useRef(onTrackedPosition);
    useEffect(() => { onTrackedPositionRef.current = onTrackedPosition; }, [onTrackedPosition]);
    useEffect(() => { trackedLatLngRef.current = trackedLatLng ?? null; }, [trackedLatLng]);

    // Load Google Maps script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.warn("Google Maps API key is not configured");
            return;
        }

        loadGoogleMapsScript(apiKey)
            .then(() => setIsScriptLoaded(true))
            .catch((error) => console.error("Failed to load Google Maps:", error));
    }, []);

    // Initialize map ONCE when script is ready
    useEffect(() => {
        if (!mapRef.current || !isScriptLoaded || typeof window === "undefined" || !window.google) {
            return;
        }

        // Only create the map if it hasn't been created yet
        if (googleMapRef.current) {
            return;
        }

        // Create map
        googleMapRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        });

        // Add click listener if callback provided
        if (onMapClick) {
            googleMapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    onMapClick(e.latLng.lat(), e.latLng.lng());
                }
            });
        }

        // Re-emit tracked marker pixel position on every pan / zoom
        googleMapRef.current.addListener("bounds_changed", () => {
            const latlng = trackedLatLngRef.current;
            if (!latlng || !googleMapRef.current) return;
            const pos = computePixelPos(googleMapRef.current, latlng.lat, latlng.lng);
            onTrackedPositionRef.current?.(clampToMapBounds(pos, mapRef.current));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScriptLoaded]);

    // Update markers
    useEffect(() => {
        if (!googleMapRef.current || !isScriptLoaded) {
            return;
        }

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // Add new markers
        markers.forEach((markerData) => {
            const marker = new google.maps.Marker({
                position: { lat: markerData.lat, lng: markerData.lng },
                map: googleMapRef.current!,
                title: markerData.title,
            });
            if (onMarkerClick && markerData.id) {
                marker.addListener("click", () => onMarkerClick(markerData.id!));
            }
            markersRef.current.push(marker);
        });
    }, [markers, isScriptLoaded, onMarkerClick]);

    // Emit pixel position immediately whenever trackedLatLng changes
    useEffect(() => {
        if (!googleMapRef.current || !isScriptLoaded) return;
        if (!trackedLatLng) {
            onTrackedPositionRef.current?.(null);
            return;
        }
        const pos = computePixelPos(googleMapRef.current, trackedLatLng.lat, trackedLatLng.lng);
        onTrackedPositionRef.current?.(clampToMapBounds(pos, mapRef.current));
    }, [trackedLatLng, isScriptLoaded]);

    // Update circles
    useEffect(() => {
        if (!googleMapRef.current || !isScriptLoaded) {
            return;
        }

        // Clear existing circles
        circlesRef.current.forEach((circle) => circle.setMap(null));
        circlesRef.current = [];

        // Add new circles
        circles.forEach((circleData) => {
            const circle = new google.maps.Circle({
                center: { lat: circleData.lat, lng: circleData.lng },
                radius: circleData.radiusMeters,
                map: googleMapRef.current!,
                fillColor: circleData.fillColor || "#4F46E5",
                fillOpacity: circleData.fillOpacity ?? 0.25,
                strokeColor: circleData.strokeColor || "#4F46E5",
                strokeOpacity: circleData.strokeOpacity ?? 0.5,
                strokeWeight: circleData.strokeWeight ?? 2,
                clickable: false,
            });
            circlesRef.current.push(circle);
        });
    }, [circles, isScriptLoaded]);

    // Update center
    useEffect(() => {
        if (googleMapRef.current) {
            googleMapRef.current.setCenter(center);
        }
    }, [center]);

    // Update zoom
    useEffect(() => {
        if (googleMapRef.current) {
            googleMapRef.current.setZoom(zoom);
        }
    }, [zoom]);

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className={clsx(className, "flex items-center justify-center bg-surface-muted")}>
                <p className="text-text-muted">Google Maps API key not configured</p>
            </div>
        );
    }

    return <div ref={mapRef} className={className} />;
}
