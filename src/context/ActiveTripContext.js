<<<<<<< HEAD

import React, { createContext, useCallback, useEffect, useState } from 'react';

import {
  acceptTrip as acceptTripService,
  completeTrip as completeTripService,
  markCashPaid as markCashPaidService,
  rejectTrip as rejectTripService,
  subscribeToActiveTrip,
  subscribeToRequestedTrips,
  updateTripStatus as updateTripStatusService,
} from '../services/tripService.js';
=======
import React, { createContext, useCallback, useEffect, useState } from 'react';

import { acceptTrip as acceptTripService, completeTrip as completeTripService, markCashPaid as markCashPaidService,
  rejectTrip as rejectTripService, subscribeToActiveTrip, subscribeToRequestedTrips,
  updateTripStatus as updateTripStatusService } from '../services/tripService.js';
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
import { TRIP_STATUS } from '../constants/tripStatus.js';
import useDriverRegistration from '../hooks/useDriverRegistration.js';
import { getData, saveData } from '../services/localStorageService.js';

export const ActiveTripContext = createContext(null);

const STORAGE_KEYS_AVAILABILITY = '@uberclone_driver_availability';

export function ActiveTripProvider({ children }) {
  const { driverId, registrationStatus, vehicleInfo } = useDriverRegistration();

  const isApproved = registrationStatus === 'approved';
  const [isAvailable, setIsAvailable] = useState(false);

  const [incomingTrips, setIncomingTrips] = useState([]);
<<<<<<< HEAD
=======

>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [tripActionLoading, setTripActionLoading] = useState(false);
  const [tripError, setTripError] = useState(null);

<<<<<<< HEAD
  // Restore availability from storage when driver is approved
=======
  // 1. Restore availability preference when driver is approved
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isApproved) {
        setIsAvailable(false);
        return;
      }
      const savedAvailability = await getData(STORAGE_KEYS_AVAILABILITY);
      if (isMounted && typeof savedAvailability === 'boolean') {
        setIsAvailable(savedAvailability);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isApproved]);

  const setAvailability = useCallback(
    async (available) => {
      if (!isApproved && available) {
        setTripError('Tu cuenta debe estar aprobada para ponerte Disponible.');
        return;
      }
      setIsAvailable(available);
      await saveData(STORAGE_KEYS_AVAILABILITY, available);
    },
    [isApproved]
  );

<<<<<<< HEAD
  // Real-time requested trips subscription
=======
  // 2. Subscription to requested trips when the driver is available and does not have an active trip
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  useEffect(() => {
    if (!isAvailable || !isApproved || !driverId || activeTripId) {
      setIncomingTrips([]);
      return undefined;
    }

    const category = vehicleInfo?.category || 'economy';
    const unsubscribe = subscribeToRequestedTrips(
      category,
      driverId,
      (trips) => {
        setIncomingTrips(trips);
      },
      (err) => {
        console.log('Error listening to incoming trips:', err);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAvailable, isApproved, driverId, vehicleInfo?.category, activeTripId]);

<<<<<<< HEAD
  // Real-time active trip document subscription
=======
  // 3. Real-time subscription to the active trip document
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  useEffect(() => {
    if (!activeTripId) {
      setActiveTrip(null);
      return undefined;
    }

    const unsubscribe = subscribeToActiveTrip(
      activeTripId,
      (trip) => {
        setActiveTrip(trip);
<<<<<<< HEAD
=======
        // If trip was cancelled or completed, clear if needed
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
        if (trip?.status === TRIP_STATUS.CANCELLED) {
          setActiveTripId(null);
        }
      },
      (err) => {
        console.log('Error listening to active trip:', err);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeTripId]);

<<<<<<< HEAD
=======
  // 4. Accept trip handler
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  const acceptTrip = useCallback(
    async (tripId) => {
      if (!driverId) return false;
      setTripActionLoading(true);
      setTripError(null);
      try {
        const accepted = await acceptTripService(tripId, driverId);
        setActiveTripId(tripId);
        setActiveTrip(accepted);
        setIncomingTrips([]);
        return true;
      } catch (err) {
        console.log('Error accepting trip:', err);
        setTripError(err.message || 'No fue posible aceptar el viaje.');
        return false;
      } finally {
        setTripActionLoading(false);
      }
    },
    [driverId]
  );

<<<<<<< HEAD
=======
  // 5. Reject trip handler
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  const rejectTrip = useCallback(
    async (tripId) => {
      if (!driverId) return;
      try {
        await rejectTripService(tripId, driverId);
        setIncomingTrips((prev) => prev.filter((t) => t.id !== tripId && t.tripId !== tripId));
      } catch (err) {
        console.log('Error rejecting trip:', err);
      }
    },
    [driverId]
  );

<<<<<<< HEAD
=======
  // 6. Update active trip status (e.g. driver_arriving, in_progress)
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  const changeTripStatus = useCallback(
    async (status, extraFields = {}) => {
      if (!activeTripId) return;
      setTripActionLoading(true);
      try {
        await updateTripStatusService(activeTripId, status, extraFields);
      } catch (err) {
        console.log(`Error updating status to ${status}:`, err);
        setTripError('Error al actualizar el estado del viaje.');
      } finally {
        setTripActionLoading(false);
      }
    },
    [activeTripId]
  );

<<<<<<< HEAD
=======
  // 7. Complete trip handler
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  const completeTrip = useCallback(
    async ({ distanceKm, durationMin, tip = 0 }) => {
      if (!activeTripId || !activeTrip) return null;
      setTripActionLoading(true);
      try {
        const category = activeTrip.category || vehicleInfo?.category || 'economy';
        const result = await completeTripService(activeTripId, {
          distanceKm: distanceKm ?? activeTrip.distanceKm,
          durationMin: durationMin ?? activeTrip.durationMin,
          category,
          tip,
        });
        return result;
      } catch (err) {
        console.log('Error completing trip:', err);
        setTripError('Error al finalizar el viaje.');
        return null;
      } finally {
        setTripActionLoading(false);
      }
    },
    [activeTripId, activeTrip, vehicleInfo?.category]
  );

<<<<<<< HEAD
=======
  // 8. Mark cash as paid
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  const confirmCashPayment = useCallback(async () => {
    if (!activeTripId) return;
    setTripActionLoading(true);
    try {
      await markCashPaidService(activeTripId);
    } catch (err) {
      console.log('Error marking cash paid:', err);
      setTripError('Error al registrar el cobro en efectivo.');
    } finally {
      setTripActionLoading(false);
    }
  }, [activeTripId]);

<<<<<<< HEAD
=======
  // 9. Reset active trip (called after reviewing summary to go back to home)
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
  const clearActiveTrip = useCallback(() => {
    setActiveTrip(null);
    setActiveTripId(null);
    setTripError(null);
  }, []);

  const value = {
    isAvailable,
    isApproved,
    setAvailability,
    incomingTrips,
    activeTrip,
    activeTripId,
    tripActionLoading,
    tripError,
    acceptTrip,
    rejectTrip,
    changeTripStatus,
    completeTrip,
    confirmCashPayment,
    clearActiveTrip,
  };

  return <ActiveTripContext.Provider value={value}>{children}</ActiveTripContext.Provider>;
}

