/**
 * Parse Google Maps URL to extract latitude and longitude coordinates
 * 
 * Supports formats:
 * - https://maps.google.com/?q=31.9539,35.9106
 * - https://www.google.com/maps/place/.../@31.9539,35.9106,17z/...
 * - https://www.google.com/maps/@31.9539,35.9106,17z
 * - https://goo.gl/maps/... (requires redirect resolution - not supported client-side)
 * - https://maps.app.goo.gl/... (short links)
 */

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export function parseGoogleMapsUrl(url: string): Coordinates | null {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const trimmedUrl = url.trim();

    // Pattern 1: ?q=lat,lng or ?query=lat,lng
    const queryMatch = trimmedUrl.match(/[?&](?:q|query)=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (queryMatch) {
        const lat = parseFloat(queryMatch[1]);
        const lng = parseFloat(queryMatch[2]);
        if (isValidCoordinates(lat, lng)) {
            return { latitude: lat, longitude: lng };
        }
    }

    // Pattern 2: @lat,lng,zoom (common in place URLs)
    const atMatch = trimmedUrl.match(/@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (atMatch) {
        const lat = parseFloat(atMatch[1]);
        const lng = parseFloat(atMatch[2]);
        if (isValidCoordinates(lat, lng)) {
            return { latitude: lat, longitude: lng };
        }
    }

    // Pattern 3: /place/lat,lng or place coordinates in path
    const placeMatch = trimmedUrl.match(/\/place\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (placeMatch) {
        const lat = parseFloat(placeMatch[1]);
        const lng = parseFloat(placeMatch[2]);
        if (isValidCoordinates(lat, lng)) {
            return { latitude: lat, longitude: lng };
        }
    }

    // Pattern 4: ll=lat,lng (old format)
    const llMatch = trimmedUrl.match(/[?&]ll=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (llMatch) {
        const lat = parseFloat(llMatch[1]);
        const lng = parseFloat(llMatch[2]);
        if (isValidCoordinates(lat, lng)) {
            return { latitude: lat, longitude: lng };
        }
    }

    // Pattern 5: !3d{lat}!4d{lng} (embedded in URL path)
    const embeddedMatch = trimmedUrl.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (embeddedMatch) {
        const lat = parseFloat(embeddedMatch[1]);
        const lng = parseFloat(embeddedMatch[2]);
        if (isValidCoordinates(lat, lng)) {
            return { latitude: lat, longitude: lng };
        }
    }

    // Pattern 6: Just coordinates pasted directly (31.9539, 35.9106)
    const directMatch = trimmedUrl.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (directMatch) {
        const lat = parseFloat(directMatch[1]);
        const lng = parseFloat(directMatch[2]);
        if (isValidCoordinates(lat, lng)) {
            return { latitude: lat, longitude: lng };
        }
    }

    return null;
}

/**
 * Validate that coordinates are within valid ranges
 */
function isValidCoordinates(lat: number, lng: number): boolean {
    return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}
