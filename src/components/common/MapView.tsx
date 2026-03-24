"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { loadGoogleMapsScript } from "@/lib/utils/googleMaps";

// ---------------------------------------------------------------------------
// POI categories
// ---------------------------------------------------------------------------
interface POICategory {
    id: string;
    label: string;
    types: string[];
    color: string;
    /** 1–2 character label shown inside the circle icon */
    letter: string;
    /** Maximum number of results to display (Places API returns up to 20 — cap it here). */
    maxResults: number;
    /** Search radius in metres — overrides the component-level poiRadius for this category. */
    radius: number;
    /** Optional keyword forwarded to the Places nearbySearch request to narrow results. */
    keyword?: string;
    /** Optional post-filter applied to API results before rendering. Return false to skip a place. */
    resultFilter?: (place: google.maps.places.PlaceResult) => boolean;
}

// ---------------------------------------------------------------------------
// Result filters
// ---------------------------------------------------------------------------


/**
 * Only keep large shopping centres / malls.
 * Requires "shopping_mall" in the result's own types array to exclude small stores.
 */
const isShoppingCentre = (place: google.maps.places.PlaceResult): boolean =>
    (place.types ?? []).includes("shopping_mall");

// ---------------------------------------------------------------------------

const POI_CATEGORIES: POICategory[] = [
    // Transit — Material Blue 700: universal transit colour (used by Google Maps, Apple Maps, OSM)
    { id: "transit",  label: "Train / Metro",   types: ["subway_station", "train_station"], color: "#1976D2", letter: "T", maxResults: 6, radius: 2000 },
    // Shopping — Material Orange 700: retail / commerce convention across major mapping platforms
    {
        id: "shopping", label: "Shopping Centre", types: ["shopping_mall"],                  color: "#F57C00", letter: "S",
        maxResults: 5, radius: 4000,
        keyword: "shopping centre shopping mall westfield plaza",
        resultFilter: isShoppingCentre,
    },
];

/** Filled circle icon — white outer ring for contrast on dark tiles, drop shadow for depth. */
function createPOIIcon(color: string, letter: string): google.maps.Icon {
    const size = 30;
    const cx = 15;
    // Slightly smaller font for two-character labels so they fit comfortably
    const fontSize = letter.length > 1 ? 8.5 : 11;
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <!-- white halo ring — visually separates the icon from any map tile colour -->
  <circle cx="${cx}" cy="${cx}" r="14" fill="white" filter="url(#ds)"/>
  <!-- coloured fill -->
  <circle cx="${cx}" cy="${cx}" r="12" fill="${color}"/>
  <!-- bold white label -->
  <text x="${cx}" y="19.5" text-anchor="middle"
        font-size="${fontSize}" font-weight="800"
        fill="white" font-family="Arial,Helvetica,sans-serif">${letter}</text>
</svg>`;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(cx, cx),
    };
}


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
 * Teardrop property pin — adapts fill colour to the app's light / dark theme.
 *
 *  • White 2.5 px stroke around the entire pin → separation from any tile colour.
 *  • Dark theme  : bright teal (#3db8b0) for normal, deep teal (#2a6b66) for selected.
 *  • Light theme : brand teal (#3a7f79 = --primary-500) for normal, deep (#255553) for selected.
 *  • Heavy drop-shadow so the pin lifts off the map surface.
 *  • Large white centre dot — distinguishes pins from flat POI circles.
 *
 * Normal   : 30 × 40 px — anchored at tip.
 * Selected : 36 × 48 px — outer glow, anchored at tip.
 */
function createPinIcon(selected: boolean, isDark = true): google.maps.Icon {
    // Use the app's primary-500 token (#3a7f79) in light mode for brand consistency;
    // brighter variants in dark mode so the pin stays visible on dark map tiles.
    const normalFill   = isDark ? "#3db8b0" : "#3a7f79";
    const selectedFill = isDark ? "#2a6b66" : "#255553";
    const glowColor    = isDark ? "#3db8b0" : "#3a7f79";

    if (selected) {
        const svg = `<svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-60%" y="-40%" width="220%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
      <feFlood flood-color="${glowColor}" flood-opacity="0.85" result="col"/>
      <feComposite in="col" in2="blur" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#glow)">
    <path d="M18,2 C10,2 3,9 3,17 C3,26 10,37 18,46 C26,37 33,26 33,17 C33,9 26,2 18,2 Z"
          fill="${selectedFill}" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="18" cy="17" r="6.5" fill="white" opacity="0.95"/>
  </g>
</svg>`;
        return {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
            scaledSize: new google.maps.Size(36, 48),
            anchor: new google.maps.Point(18, 46),
        };
    }

    const svg = `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="sh" x="-50%" y="-30%" width="200%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>
  <g filter="url(#sh)">
    <path d="M15,2 C8,2 2,8 2,14.5 C2,22 8,31 15,38.5 C22,31 28,22 28,14.5 C28,8 22,2 15,2 Z"
          fill="${normalFill}" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="15" cy="14.5" r="5.5" fill="white" opacity="0.95"/>
  </g>
</svg>`;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(30, 40),
        anchor: new google.maps.Point(15, 38),
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
    /** When true, fetches and displays nearby POIs (train stations, shopping centres, schools, hospitals) using the Places API. */
    showNearbyPOIs?: boolean;
    /** Centre point for the nearby POI search — typically the property location. */
    poiCenter?: { lat: number; lng: number } | null;
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
    showNearbyPOIs = false,
    poiCenter = null,
    className = "h-96 w-full rounded-lg",
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const markerIdMapRef = useRef<Map<string, google.maps.Marker>>(new Map());
    const circlesRef = useRef<google.maps.Circle[]>([]);
    // POI refs
    const poiMarkersRef = useRef<google.maps.Marker[]>([]);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    
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

        // Map colour scheme follows the system dark/light preference
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
                icon: createPinIcon(isSelected, true), // map is always dark
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
            if (m) { m.setIcon(createPinIcon(false, true)); m.setZIndex(0); }
        }
        if (selectedId) {
            const m = markerIdMapRef.current.get(selectedId);
            if (m) { m.setIcon(createPinIcon(true, true)); m.setZIndex(9999); }
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

    // Fetch and display nearby POIs via Places API
    useEffect(() => {
        if (!showNearbyPOIs || !poiCenter || !isScriptLoaded || !googleMapRef.current) {
            // Clear POI markers when disabled or no center
            poiMarkersRef.current.forEach((m) => m.setMap(null));
            poiMarkersRef.current = [];
            return;
        }

        if (!window.google?.maps?.places?.PlacesService) {
            console.warn("Google Maps Places API not available — enable it in your Google Cloud Console.");
            return;
        }

        let cancelled = false;
        const map = googleMapRef.current;

        // Clear stale POI markers before issuing new requests
        poiMarkersRef.current.forEach((m) => m.setMap(null));
        poiMarkersRef.current = [];

        // Lazily initialise supporting objects
        if (!placesServiceRef.current) {
            placesServiceRef.current = new google.maps.places.PlacesService(map);
        }

        const service = placesServiceRef.current;
        const seenPlaceIds = new Set<string>();

        for (const category of POI_CATEGORIES) {
            for (const type of category.types) {
                service.nearbySearch(
                    {
                        location: poiCenter,
                        radius: category.radius,
                        type,
                        ...(category.keyword ? { keyword: category.keyword } : {}),
                    },
                    (results, status) => {
                        if (cancelled) return;
                        if (
                            status !== google.maps.places.PlacesServiceStatus.OK ||
                            !results
                        ) return;

                        // Apply optional post-filter, then take only the top N by prominence
                        const filtered = category.resultFilter
                            ? results.filter(category.resultFilter)
                            : results;
                        filtered.slice(0, category.maxResults).forEach((place) => {
                            if (cancelled) return;
                            if (!place.place_id || seenPlaceIds.has(place.place_id)) return;
                            seenPlaceIds.add(place.place_id);

                            const loc = place.geometry?.location;
                            if (!loc) return;

                            const marker = new google.maps.Marker({
                                position: loc,
                                map,
                                title: place.name,
                                icon: createPOIIcon(category.color, category.letter),
                                zIndex: 50,
                                optimized: false,
                            });


                            poiMarkersRef.current.push(marker);
                        });
                    },
                );
            }
        }

        return () => {
            cancelled = true;
            poiMarkersRef.current.forEach((m) => m.setMap(null));
            poiMarkersRef.current = [];
        };

    // POI_CATEGORIES / createPOIIcon are module-level constants (stable references).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showNearbyPOIs, poiCenter?.lat, poiCenter?.lng, isScriptLoaded]);

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

    return (
        <div className={clsx(className, "relative overflow-hidden")}>
            {/* The actual Google Maps canvas — fills the container */}
            <div ref={mapRef} className="absolute inset-0" />
        </div>
    );
}
