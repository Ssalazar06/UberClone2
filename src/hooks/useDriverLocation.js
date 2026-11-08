
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../config/firebaseConfig.js';
import useDriverRegistration from './useDriverRegistration.js';

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
 * Rules:
 * - Active only when isAvailable is true and driver is approved.
 * - When isAvailable transitions to false, watchPosition is stopped (cleanup function).
 * - Writes currentLocation to Firestore `drivers/{driverId}` throttled every ~5 seconds.
 * 
 * @param {boolean} isAvailable - Driver's availability toggle state
 * @returns {{
 *   location: { latitude: number, longitude: number, heading: number, speed: number } | null,
 *   region: { latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number },
 *   errorMsg: string | null,
 *   hasPermission: boolean,
 *   isTracking: boolean,
 * }}
 */
export default function useDriverLocation(isAvailable = false) {
  const { driverId, registrationStatus } = useDriverRegistration();
  const isApproved = registrationStatus === 'approved';

  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(DEFAULT_MEDELLIN_COORDS);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Throttle Firestore updates (min 5 seconds between writes)
  const lastWriteTimeRef = useRef(0);
  const subscriptionRef = useRef(null);

  // 1. Request foreground permissions on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (status !== 'granted') {
          setErrorMsg('Se requiere permiso de ubicación para recibir viajes.');
          setHasPermission(false);
          return;
        }

        setHasPermission(true);

        // Get initial single position
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
      } catch (err) {
        console.log('Error requesting location:', err);
        if (isMounted) setErrorMsg('No fue posible obtener la ubicación inicial.');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Continuous tracking when driver is available and approved
  useEffect(() => {
    let isSubscribed = true;

    const stopTracking = () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      setIsTracking(false);
    };

    if (!isAvailable || !isApproved || !hasPermission || !driverId) {
      stopTracking();
      return undefined;
    }

    const startTracking = async () => {
      try {
        stopTracking(); // Ensure no duplicate watcher

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 4000,
            distanceInterval: 10,
          },
          (newLocation) => {
            if (!isSubscribed) return;

            const coords = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              heading: newLocation.coords.heading || 0,
              speed: newLocation.coords.speed || 0,
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
          }
        );

        if (isSubscribed) {
          subscriptionRef.current = sub;
          setIsTracking(true);
        } else {
          sub.remove();
        }
      } catch (err) {
        console.log('Error starting location watcher:', err);
        if (isSubscribed) {
          setErrorMsg('Error al activar el seguimiento de ubicación.');
          setIsTracking(false);
        }
      }
    };

    startTracking();

    // Mandatory cleanup function to avoid memory leaks
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

