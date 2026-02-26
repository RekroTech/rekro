/**
 * Location privacy utilities
 * These functions help protect exact property locations by adding approximation
 */

/**
 * Add random offset to coordinates to show approximate location
 * @param lat Original latitude
 * @param lng Original longitude
 * @param radiusKm Radius in kilometers for the offset (default: 0.5km)
 * @returns Approximate coordinates
 */
export function getApproximateLocation(
    lat: number,
    lng: number,
    radiusKm: number = 0.5
): { lat: number; lng: number } {
    // Convert km to degrees (approximate)
    // 1 degree latitude ≈ 111 km
    // 1 degree longitude varies by latitude, but we'll use a simple approximation
    const latOffset = (radiusKm / 111) * (Math.random() * 2 - 1);
    const lngOffset =
        (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * (Math.random() * 2 - 1);

    return {
        lat: lat + latOffset,
        lng: lng + lngOffset,
    };
}

/**
 * Format address to show only locality (suburb/city and state)
 * @param address Full address object
 * @returns Locality string (e.g., "Bondi Beach, NSW" or "Sydney, NSW")
 */
export function getLocalityString(address?: {
    street?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
}): string {
    if (!address) return "";

    const parts: string[] = [];

    // Prefer suburb over city for more specific locality
    if (address.suburb) {
        parts.push(address.suburb);
    } else if (address.city) {
        parts.push(address.city);
    }

    if (address.state) {
        parts.push(address.state);
    }

    return parts.join(", ");
}

/**
 * Check if a coordinate is within a certain radius of the original
 * Useful for validation
 */
export function isWithinRadiusV2(
    original: { lat: number; lng: number },
    test: { lat: number; lng: number },
    radiusKm: number
): boolean {
    const R = 6371; // Earth's radius in km
    const dLat = ((test.lat - original.lat) * Math.PI) / 180;
    const dLng = ((test.lng - original.lng) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((original.lat * Math.PI) / 180) *
            Math.cos((test.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
}
