/**
 * Utility functions for Google Maps redirection and coordinates handling
 */

export interface LocationCoordinates {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

/**
 * Generate a direct Google Maps directions URL for joiners to navigate to the playground.
 * If exact lat/lng is available, targets exact coordinates.
 * Otherwise falls back to searching venue name and address.
 */
export function getGoogleMapsUrl(location: LocationCoordinates): string {
  const { name, address, lat, lng } = location;

  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const query = encodeURIComponent([name, address].filter(Boolean).join(', ') || 'Bengaluru');
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Generate a Google Maps view/search URL for inspecting the playground location.
 */
export function getGoogleMapsSearchUrl(location: LocationCoordinates): string {
  const { name, address, lat, lng } = location;

  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const query = encodeURIComponent([name, address].filter(Boolean).join(', ') || 'Bengaluru');
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Popular sports grounds & turfs with verified coordinates
 */
export const POPULAR_VENUES = [
  {
    name: 'Koramangala Turf Arena',
    address: '4th Block, Koramangala, Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    name: 'HSR Sports Ground',
    address: 'Sector 2, HSR Layout, Bengaluru',
    lat: 12.9116,
    lng: 77.6389,
  },
  {
    name: 'Indiranagar Football Arena',
    address: '100 Feet Road, Indiranagar, Bengaluru',
    lat: 12.9719,
    lng: 77.6412,
  },
  {
    name: 'BTM Layout Basketball Court',
    address: '2nd Stage, BTM Layout, Bengaluru',
    lat: 12.9166,
    lng: 77.6101,
  },
  {
    name: 'Decathlon Play Arena Sarjapur',
    address: 'Sarjapur Main Road, Bengaluru',
    lat: 12.9081,
    lng: 77.6833,
  },
  {
    name: 'Padukone-Dravid Sports Centre',
    address: 'Bettahalasuru, Bengaluru',
    lat: 13.1986,
    lng: 77.7066,
  },
  {
    name: 'Jayanagar National College Ground',
    address: '7th Block, Jayanagar, Bengaluru',
    lat: 12.9304,
    lng: 77.5838,
  },
];

/**
 * Calculates Haversine distance in meters between two GPS coordinates
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
