import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../config/firebaseConfig.js';
import useDriverRegistration from './useDriverRegistration.js';

let CommunityGeolocation = null;
try {
  const geoModule = require('@react-native-community/geolocation');
  CommunityGeolocation = geoModule.default || geoModule;
} catch (err) {
  // Fallback to navigator.geolocation or expo-location if module is not linked in Expo Go
  CommunityGeolocation = typeof navigator !== 'undefined' ? navigator.geolocation : null;
}

// Default initial location: Medellín centro
const DEFAULT_MEDELLIN_COORDS = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
  heading: 0,
  speed: 0,
};

/**
 * Custom hook to track driver's location in real-time and sync it with Firestore.
 *
 * Uses `@react-native-community/geolocation` (`watchPosition` + `clearWatch` in cleanup)
 * per team architecture decisions, with automatic fallback to `expo-location` inside Expo Go.
 *
 * Rules:
 * - Active only when isAvailable is true and driver is approved.
 * - Mandatory cleanup function in useEffect (`Geolocation.clearWatch(watchId)` / `subscription.remove()`).
 * - Writes currentLocation to Firestore `drivers/{driverId}` throttled every ~5 seconds.
 */
export default function useDriverLocation(isAvailable = false) {
  const { driverId, registrationStatus } = useDriverRegistration();
  const isApproved = registrationStatus === 'approved';

  const [location, setLocation] = useState({
    latitude: DEFAULT_MEDELLIN_COORDS.latitude,
    longitude: DEFAULT_MEDELLIN_COORDS.longitude,
    heading: 0,
    speed: 0,
  });
  const [region, setRegion] = useState(DEFAULT_MEDELLIN_COORDS);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Throttle Firestore updates (min 5 seconds between writes)
  const lastWriteTimeRef = useRef(0);
  const watchIdRef = useRef(null);
  const expoSubRef = useRef(null);

  // 1. Request foreground location permissions and initial position on mount
  useEffect(() => {
    let isMounted = true;

    const requestPermissionAndInitialLocation = async () => {
      try {
        let granted = false;

        if (Platform.OS === 'android' && PermissionsAndroid?.request) {
          const res = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          granted = res === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!granted) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          granted = status === 'granted';
        }

        if (!isMounted) return;

        if (!granted) {
          setErrorMsg('Se requiere permiso de ubicación para recibir viajes.');
          setHasPermission(false);
          return;
        }

        setHasPermission(true);

        // Try @react-native-community/geolocation getCurrentPosition first
        if (CommunityGeolocation && typeof CommunityGeolocation.getCurrentPosition === 'function') {
          CommunityGeolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted || !pos?.coords) return;
              const coords = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                heading: pos.coords.heading || 0,
                speed: pos.coords.speed || 0,
              };
              setLocation(coords);
              setRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              });
            },
            async () => {
              // Fallback to expo-location if CommunityGeolocation fails in Expo Go
              try {
                const current = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });
                if (!isMounted) return;
                const coords = {
                  latitude: current.coords.latitude,
                  longitude: current.coords.longitude,
                  heading: current.coords.heading || 0,
                  speed: current.coords.speed || 0,
                };
                setLocation(coords);
                setRegion({
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                });
              } catch (fallbackErr) {
                console.log('Initial location fallback:', fallbackErr);
              }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );
        } else {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!isMounted) return;
          const coords = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            heading: current.coords.heading || 0,
            speed: current.coords.speed || 0,
          };
          setLocation(coords);
          setRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      } catch (err) {
        console.log('Error requesting location:', err);
        if (isMounted) setErrorMsg('No fue posible obtener la ubicación inicial.');
      }
    };

    requestPermissionAndInitialLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Continuous tracking when driver is available and approved
  useEffect(() => {
    let isSubscribed = true;

    const handlePositionUpdate = (rawCoords) => {
      if (!isSubscribed || !rawCoords) return;

      const coords = {
        latitude: rawCoords.latitude,
        longitude: rawCoords.longitude,
        heading: rawCoords.heading || 0,
        speed: rawCoords.speed || 0,
      };

      setLocation(coords);
      setRegion((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));

      // Sync with Firestore every ~5s
      const now = Date.now();
      if (now - lastWriteTimeRef.current >= 5000) {
        lastWriteTimeRef.current = now;
        const driverRef = doc(db, 'drivers', driverId);
        updateDoc(driverRef, {
          currentLocation: {
            lat: coords.latitude,
            lng: coords.longitude,
            heading: coords.heading,
            updatedAt: serverTimestamp(),
          },
          isAvailable: true,
        }).catch((err) => {
          console.log('Error syncing location to Firestore:', err);
        });
      }
    };

    const stopTracking = () => {
      if (
        watchIdRef.current !== null &&
        CommunityGeolocation &&
        typeof CommunityGeolocation.clearWatch === 'function'
      ) {
        CommunityGeolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (expoSubRef.current) {
        expoSubRef.current.remove();
        expoSubRef.current = null;
      }
      setIsTracking(false);
    };

    if (!isAvailable || !isApproved || !hasPermission || !driverId) {
      stopTracking();
      return undefined;
    }

    const startExpoFallbackWatcher = async () => {
      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 4000,
            distanceInterval: 10,
          },
          (newLocation) => handlePositionUpdate(newLocation.coords)
        );
        if (isSubscribed) {
          expoSubRef.current = sub;
          setIsTracking(true);
        } else {
          sub.remove();
        }
      } catch (err) {
        console.log('Error starting expo-location watcher:', err);
        if (isSubscribed) {
          setErrorMsg('Error al activar el seguimiento de ubicación.');
          setIsTracking(false);
        }
      }
    };

    // Primary: @react-native-community/geolocation watchPosition
    if (CommunityGeolocation && typeof CommunityGeolocation.watchPosition === 'function') {
      try {
        stopTracking();
        const id = CommunityGeolocation.watchPosition(
          (position) => {
            if (!isSubscribed) return;
            setIsTracking(true);
            handlePositionUpdate(position.coords);
          },
          () => {
            // If native bridge is unavailable in Expo Go, switch cleanly to expo-location
            startExpoFallbackWatcher();
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 10,
            interval: 4000,
            fastestInterval: 2000,
          }
        );
        watchIdRef.current = id;
        setIsTracking(true);
      } catch (err) {
        startExpoFallbackWatcher();
      }
    } else {
      startExpoFallbackWatcher();
    }

    // Mandatory cleanup function (`clearWatch` + `remove()`) to prevent memory leaks
    return () => {
      isSubscribed = false;
      stopTracking();
    };
  }, [isAvailable, isApproved, hasPermission, driverId]);

  return {
    location,
    region,
    errorMsg,
    hasPermission,
    isTracking,
  };
}
