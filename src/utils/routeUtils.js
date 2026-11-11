import { GOOGLE_MAPS_API_KEY } from '../config/appConfig.js';

const GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

/**
 * Decodes an encoded Google Maps polyline string into an array of { latitude, longitude } objects.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export const decodeGooglePolyline = (encoded = '') => {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Haversine distance calculation (km) with 1.3 urban road factor as fallback.
 */
export const calculateHaversineMetrics = (origin, destination) => {
  const lat1 = origin?.lat ?? origin?.latitude ?? 6.2442;
  const lon1 = origin?.lng ?? origin?.longitude ?? -75.5812;
  const lat2 = destination?.lat ?? destination?.latitude ?? 6.2088;
  const lon2 = destination?.lng ?? destination?.longitude ?? -75.5678;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.max(1.2, Math.round(R * c * 1.3 * 10) / 10);
  const durationMin = Math.max(6, Math.round((distanceKm / 25) * 60));

  return { distanceKm, durationMin };
};

/**
 * Calls Google Routes API v2 (`directions/v2:computeRoutes`) ONLY when creating or accepting
 * a trip request to obtain real distance (km) and traffic-aware duration (min).
 * Never called on every GPS location update.
 * Falls back to Haversine estimation if no API key is configured or on network error.
 */
export const fetchDistanceMatrix = async (origin, destination) => {
  const fallback = calculateHaversineMetrics(origin, destination);
  if (!origin || !destination) return fallback;

  const startLat = Number(origin.lat ?? origin.latitude);
  const startLng = Number(origin.lng ?? origin.longitude);
  const endLat = Number(destination.lat ?? destination.latitude);
  const endLng = Number(destination.lng ?? destination.longitude);

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const response = await fetch(GOOGLE_ROUTES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
        },
        body: JSON.stringify({
          origin: {
            location: { latLng: { latitude: startLat, longitude: startLng } },
          },
          destination: {
            location: { latLng: { latitude: endLat, longitude: endLng } },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          languageCode: 'es-CO',
          units: 'METRIC',
        }),
      });

      const data = await response.json();
      const route = data?.routes?.[0];

      if (route?.distanceMeters) {
        const distanceKm = Math.max(
          0.5,
          Math.round((route.distanceMeters / 1000) * 10) / 10
        );
        // route.duration comes in seconds format like "1085s"
        const seconds = parseInt(String(route.duration || '0').replace('s', ''), 10) || 0;
        const durationMin = Math.max(1, Math.round(seconds / 60));
        return { distanceKm, durationMin };
      }
    } catch (error) {
      console.log('Google Routes API (metrics) fallback triggered:', error);
    }
  }

  return fallback;
};

/**
 * Fetches a driving route polyline between two coordinates.
 * Primary: Google Routes API v2 (`routes.polyline.encodedPolyline`) when `GOOGLE_MAPS_API_KEY` is set.
 * Fallback: OSRM driving route API, then straight line.
 * Called ONLY once when accepting a trip and once when the passenger boards.
 */
export const fetchRouteCoordinates = async (origin, destination) => {
  if (!origin || !destination) return [];

  const startLat = Number(origin.lat ?? origin.latitude);
  const startLon = Number(origin.lng ?? origin.longitude);
  const endLat = Number(destination.lat ?? destination.latitude);
  const endLon = Number(destination.lng ?? destination.longitude);

  const fallback = [
    { latitude: startLat, longitude: startLon },
    { latitude: endLat, longitude: endLon },
  ];

  // 1. Primary: Google Routes API v2 (`computeRoutes`)
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const res = await fetch(GOOGLE_ROUTES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: {
            location: { latLng: { latitude: startLat, longitude: startLon } },
          },
          destination: {
            location: { latLng: { latitude: endLat, longitude: endLon } },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          languageCode: 'es-CO',
          units: 'METRIC',
        }),
      });

      const data = await res.json();
      const encodedPoints = data?.routes?.[0]?.polyline?.encodedPolyline;

      if (encodedPoints) {
        const decoded = decodeGooglePolyline(encodedPoints);
        if (decoded.length >= 2) return decoded;
      }
    } catch (err) {
      console.log('Google Routes API (polyline) fallback to OSRM:', err);
    }
  }

  // 2. Fallback: OSRM free routing service
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (data?.code === 'Ok' && data.routes?.length > 0) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }
    return fallback;
  } catch (error) {
    console.log('Error fetching route, using straight line:', error);
    return fallback;
  }
};

/**
 * Reverse geocoding via Google Geocoding API.
 */
export const reverseGeocodeAddress = async (lat, lng) => {
  if (!GOOGLE_MAPS_API_KEY || typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.status === 'OK' && data.results?.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (err) {
    console.log('Error in Google Geocoding API:', err);
    return null;
  }
};

/**
 * Formats an integer amount in Colombian Pesos (COP).
 */
export const formatCOP = (amount) => {
  const num = Math.round(Number(amount) || 0);
  return `$${num.toLocaleString('es-CO')} COP`;
};
