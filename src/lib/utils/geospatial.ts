/**
 * Geospatial utility functions for location-based features
 */

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate bounding box for a given center point and radius
 * Useful for database queries to pre-filter before calculating exact distances
 * @param center Center coordinates
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(center: Coordinates, radiusKm: number): BoundingBox {
    // Approximate: 1 degree of latitude = 111 km
    const latDelta = radiusKm / 111;

    // Longitude varies by latitude
    const lngDelta = radiusKm / (111 * Math.cos(toRadians(center.lat)));

    return {
        minLat: center.lat - latDelta,
        maxLat: center.lat + latDelta,
        minLng: center.lng - lngDelta,
        maxLng: center.lng + lngDelta,
    };
}

/**
 * Check if a point is within a given radius of a center point
 * @param point Point to check
 * @param center Center point
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(point: Coordinates, center: Coordinates, radiusKm: number): boolean {
    const distance = calculateDistance(center.lat, center.lng, point.lat, point.lng);
    return distance <= radiusKm;
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "1.2 km", "500 m")
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        const meters = Math.round(distanceKm * 1000);
        return `${meters} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
}

/**
 * Get user's current location using browser geolocation API
 * @returns Promise with user coordinates or null if denied/unavailable
 */
export function getUserLocation(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
            console.warn("Geolocation not supported");
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Error getting user location:", error);
                resolve(null);
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000, // 5 minutes
            }
        );
    });
}

/**
 * Calculate the center point of multiple coordinates
 * @param coordinates Array of coordinates
 * @returns Center point
 */
export function getCenterPoint(coordinates: Coordinates[]): Coordinates | null {
    if (coordinates.length === 0) return null;

    const sum = coordinates.reduce(
        (acc, coord) => ({
            lat: acc.lat + coord.lat,
            lng: acc.lng + coord.lng,
        }),
        { lat: 0, lng: 0 }
    );

    return {
        lat: sum.lat / coordinates.length,
        lng: sum.lng / coordinates.length,
    };
}

/**
 * Default locations for various Australian cities
 */
export const DEFAULT_LOCATIONS = {
    SYDNEY: { lat: -33.8688, lng: 151.2093 },
    MELBOURNE: { lat: -37.8136, lng: 144.9631 },
    BRISBANE: { lat: -27.4698, lng: 153.0251 },
    PERTH: { lat: -31.9505, lng: 115.8605 },
    ADELAIDE: { lat: -34.9285, lng: 138.6007 },
    CANBERRA: { lat: -35.2809, lng: 149.13 },
} as const;

/**
 * Common search radius options in kilometers
 */
export const SEARCH_RADIUS_OPTIONS = [
    { value: 1, label: "1 km" },
    { value: 2, label: "2 km" },
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 20, label: "20 km" },
    { value: 50, label: "50 km" },
] as const;
