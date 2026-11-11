/**
 * When `true`, photos are uploaded to Firebase Storage and Firestore keeps the
 * download URL. Firebase Storage must be enabled in the Firebase console
 * (new buckets `*.firebasestorage.app` require the Blaze plan).
 * When `false`, Firestore keeps the local URI of the photo (useful for demos).
 */
export const USE_FIREBASE_STORAGE = false;

/**
 * Google Maps Platform API Key loaded from .env (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`).
 * Enabled APIs in Google Cloud Console:
 * - Routes API (`computeRoutes` v2 — unifies Directions & Distance Matrix)
 * - Geocoding API
 * - Places API (New)
 * - Maps JavaScript API
 * - Maps SDK for Android
 */
export const GOOGLE_MAPS_API_KEY =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.trim()
    : '') || '';
