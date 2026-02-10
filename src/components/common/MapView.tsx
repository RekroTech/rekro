"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/lib/utils/googleMaps";

interface MapViewProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: Array<{ lat: number; lng: number; title?: string }>;
    onMapClick?: (lat: number, lng: number) => void;
    className?: string;
}

export function MapView({
    center = { lat: -33.8688, lng: 151.2093 }, // Default to Sydney
    zoom = 12,
    markers = [],
    onMapClick,
    className = "h-96 w-full rounded-lg",
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

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

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || !isScriptLoaded || typeof window === "undefined" || !window.google) {
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
    }, [isScriptLoaded, center, zoom, onMapClick]);

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
            markersRef.current.push(marker);
        });
    }, [markers, isScriptLoaded]);

    // Update center
    useEffect(() => {
        if (googleMapRef.current) {
            googleMapRef.current.setCenter(center);
        }
    }, [center]);

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-100`}>
                <p className="text-gray-500">Google Maps API key not configured</p>
            </div>
        );
    }

    return <div ref={mapRef} className={className} />;
}
