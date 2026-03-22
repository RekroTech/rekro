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
 * Generates a data-URL SVG icon for a map pin marker.
 * Normal state: 32×44 px indigo pin.
 * Selected state: 40×55 px violet pin (scaled ×1.25, brighter gradient).
 */
function createPinIcon(selected: boolean): google.maps.Icon {
    const w = selected ? 40 : 32;
    const h = selected ? 55 : 44;
    const anchorX = selected ? 20 : 16;
    const anchorY = selected ? 54 : 43;

    // Rekro brand palette
    // Normal  → primary teal:   #86b6b0 (primary-300) → #2f6a65 (primary-600)
    // Selected → secondary navy: #6b7a9a              → #3a4a6b (secondary-500)
    const primaryColor = selected ? "#3a4a6b" : "#2f6a65";
    const lightColor   = selected ? "#6b7a9a" : "#86b6b0";
    const shadowBlur   = selected ? 3.5 : 2.5;
    const shadowDy     = selected ? 5   : 3;

    // Pin path — circle r=14 centred at (16,16), tip at (16,43).
    // Selected version is the same path scaled ×1.25.
    const pinPath = selected
        ? "M20 2.5C10.335 2.5 2.5 10.335 2.5 20c0 6.764 3.618 12.7 9.043 16.006L20 53.75l8.458-16.494C33.883 32.7 37.5 26.764 37.5 20 37.5 10.335 29.665 2.5 20 2.5z"
        : "M16 2C8.268 2 2 8.268 2 16c0 5.411 2.894 10.16 7.234 12.805L16 43l6.766-13.195C27.106 26.16 30 21.411 30 16 30 8.268 23.732 2 16 2z";

    // Gloss highlight ellipse (top-left of circle)
    const gx = selected ? 13   : 10.5;
    const gy = selected ? 12   :  9.5;
    const grx = selected ? 6   :  4.8;
    const gry = selected ? 3.8 :  3.0;

    // Ring for selected state
    const ring = selected
        ? `<circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>`
        : "";

    const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${shadowBlur}"/>
      <feOffset dx="0" dy="${shadowDy}" result="blur"/>
      <feFlood flood-color="rgba(0,0,0,0.28)" result="col"/>
      <feComposite in="col" in2="blur" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="rg" cx="38%" cy="32%" r="68%" fx="35%" fy="28%">
      <stop offset="0%" stop-color="${lightColor}"/>
      <stop offset="100%" stop-color="${primaryColor}"/>
    </radialGradient>
  </defs>
  <path d="${pinPath}" fill="url(#rg)" filter="url(#ds)"/>
  ${ring}
  <ellipse cx="${gx}" cy="${gy}" rx="${grx}" ry="${gry}"
           fill="rgba(255,255,255,0.52)" transform="rotate(-25 ${gx} ${gy})"/>
</svg>`;

    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(w, h),
        anchor: new google.maps.Point(anchorX, anchorY),
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
