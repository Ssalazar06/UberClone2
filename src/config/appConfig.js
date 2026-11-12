import { NativeModules, Platform } from 'react-native';

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

const resolveLocalBackendHost = (configuredUrl) => {
  if (!configuredUrl.includes('localhost') && !configuredUrl.includes('127.0.0.1')) {
    return configuredUrl;
  }
  if (Platform.OS === 'web') return configuredUrl;

  // In Expo Go / dev builds, extract the development server IP from scriptURL so physical devices reach the PC
  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  const match = scriptURL.match(/^https?:\/\/([^/:]+)/i);
  if (match?.[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
    return configuredUrl.replace(/localhost|127\.0\.0\.1/g, match[1]);
  }

  // Android Emulator maps host localhost to 10.0.2.2
  if (Platform.OS === 'android') {
    return configuredUrl.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
  }

  return configuredUrl;
};

const rawPaymentUrl =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_PAYMENT_API_URL
    ? process.env.EXPO_PUBLIC_PAYMENT_API_URL.trim().replace(/\/$/, '')
    : '') || 'http://localhost:3001';

/**
 * Base URL of the Express payments backend (`POST /payments/preference`, `POST /payments/webhook`).
 */
export const PAYMENT_API_URL = resolveLocalBackendHost(rawPaymentUrl);
