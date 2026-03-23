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



/**
 * Generates a data-URL SVG circle marker.
 *
 * Normal   : 28 × 28 px — primary teal gradient, white centre dot.
 * Selected : 36 × 36 px — secondary navy gradient, pulsing outer ring, brighter dot.
 *
 * Anchor is the circle centre so the dot sits exactly on the coordinate.
 */
function createPinIcon(selected: boolean): google.maps.Icon {
    let svg: string;

    if (selected) {
        svg = `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="ds" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="0" result="blur"/>
      <feFlood flood-color="rgba(255,255,255,0.35)" result="col"/>
      <feComposite in="col" in2="blur" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="rg" cx="38%" cy="32%" r="68%">
      <stop offset="0%" stop-color="#e07878"/>
      <stop offset="100%" stop-color="#8b1a1a"/>
    </radialGradient>
  </defs>
  <!-- Soft outer glow ring -->
  <circle cx="18" cy="18" r="17" fill="rgba(200,80,80,0.18)" filter="url(#glow)"/>
  <!-- Main circle with white glow shadow -->
  <circle cx="18" cy="18" r="13" fill="url(#rg)" filter="url(#ds)"/>
</svg>`;
        return {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            scaledSize: new google.maps.Size(36, 36),
            anchor: new google.maps.Point(18, 18),
        };
    }

    svg = `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ds" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
      <feOffset dx="0" dy="0" result="blur"/>
      <feFlood flood-color="rgba(255,255,255,0.28)" result="col"/>
      <feComposite in="col" in2="blur" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="rg" cx="38%" cy="32%" r="68%">
      <stop offset="0%" stop-color="#e87878"/>
      <stop offset="100%" stop-color="#c23232"/>
    </radialGradient>
  </defs>
  <!-- Main circle with white glow shadow -->
  <circle cx="14" cy="14" r="12" fill="url(#rg)" filter="url(#ds)"/>
</svg>`;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 14),
    };
}

interface MapViewProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    /** When set, smoothly pans (and optionally zooms) the map to this position. */
    flyTo?: { lat: number; lng: number; zoom?: number } | null;
    markers?: Array<{ lat: number; lng: number; title?: string; id?: string }>;
    onMarkerClick?: (id: string) => void;
    /** ID of the currently selected marker — rendered larger with a different colour. */
    selectedId?: string | null;
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
    flyTo,
    markers = [],
    circles = [],
    onMapClick,
    onMarkerClick,
    selectedId,
    trackedLatLng,
    onTrackedPosition,
    className = "h-96 w-full rounded-lg",
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const markerIdMapRef = useRef<Map<string, google.maps.Marker>>(new Map());
    const circlesRef = useRef<google.maps.Circle[]>([]);

    // Keep a ref so the marker-creation effect can read the current selectedId
    // without needing it as a dependency (avoids full marker recreation on click).
    const selectedIdRef = useRef<string | null | undefined>(selectedId);
    useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
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

        // Map is always dark — matches the app's dark UI on all platforms.
        googleMapRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            colorScheme: google.maps.ColorScheme.DARK,
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
        markerIdMapRef.current.clear();

        // Add new markers with custom SVG pin icons
        markers.forEach((markerData) => {
            const isSelected = markerData.id != null && markerData.id === selectedIdRef.current;
            const marker = new google.maps.Marker({
                position: { lat: markerData.lat, lng: markerData.lng },
                map: googleMapRef.current!,
                title: markerData.title,
                icon: createPinIcon(isSelected),
                zIndex: isSelected ? 9999 : undefined,
                optimized: false,
            });
            if (onMarkerClick && markerData.id) {
                marker.addListener("click", () => onMarkerClick(markerData.id!));
            }
            if (markerData.id) {
                markerIdMapRef.current.set(markerData.id, marker);
            }
            markersRef.current.push(marker);
        });
    }, [markers, isScriptLoaded, onMarkerClick]);

    // Efficiently swap only the affected markers' icons when selection changes
    // (avoids full marker recreation on every click)
    const prevSelectedIdRef = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        if (!isScriptLoaded) return;
        const prevId = prevSelectedIdRef.current;
        prevSelectedIdRef.current = selectedId;

        if (prevId) {
            const m = markerIdMapRef.current.get(prevId);
            if (m) { m.setIcon(createPinIcon(false)); m.setZIndex(0); }
        }
        if (selectedId) {
            const m = markerIdMapRef.current.get(selectedId);
            if (m) { m.setIcon(createPinIcon(true)); m.setZIndex(9999); }
        }
    }, [selectedId, isScriptLoaded]);

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
                fillColor: circleData.fillColor || "#3a7f79",
                fillOpacity: circleData.fillOpacity ?? 0.25,
                strokeColor: circleData.strokeColor || "#3a7f79",
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

    // Fly to a specific location (smooth pan + optional zoom override)
    useEffect(() => {
        if (!googleMapRef.current || !flyTo) return;
        googleMapRef.current.panTo({ lat: flyTo.lat, lng: flyTo.lng });
        if (flyTo.zoom != null) googleMapRef.current.setZoom(flyTo.zoom);
    }, [flyTo]);

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className={clsx(className, "flex items-center justify-center bg-surface-muted")}>
                <p className="text-text-muted">Google Maps API key not configured</p>
            </div>
        );
    }

    return <div ref={mapRef} className={className} />;
}
