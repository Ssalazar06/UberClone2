import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { acceptTrip as acceptTripService, completeTrip as completeTripService,
  getOngoingTripForDriver, markCashPaid as markCashPaidService,
  rejectTrip as rejectTripService, subscribeToActiveTrip, subscribeToDriverPaidTrips,
  subscribeToRequestedTrips, switchTripPaymentMethod as switchTripPaymentMethodService,
  updateTripStatus as updateTripStatusService } from '../services/tripService.js';
import {
  checkTripPaymentStatus as checkTripPaymentStatusService,
  createPaymentPreference as createPaymentPreferenceService,
} from '../services/paymentService.js';
import { calculateDriverBalance } from '../utils/calculateDriverBalance.js';
import { PAYMENT_METHODS, TRIP_STATUS } from '../constants/tripStatus.js';
import useDriverRegistration from '../hooks/useDriverRegistration.js';
import { getData, saveData } from '../services/localStorageService.js';
import { notifyIncomingTripRequest } from '../services/notificationService.js';

export const ActiveTripContext = createContext(null);

const STORAGE_KEYS_AVAILABILITY = '@uberclone_driver_availability';

export function ActiveTripProvider({ children }) {
  const { driverId, registrationStatus, vehicleInfo } = useDriverRegistration();

  const isApproved = registrationStatus === 'approved';
  const [isAvailable, setIsAvailable] = useState(false);

  const [incomingTrips, setIncomingTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [paidTrips, setPaidTrips] = useState([]);
  const [paymentPreference, setPaymentPreference] = useState(null);
  const [tripActionLoading, setTripActionLoading] = useState(false);
  const [tripError, setTripError] = useState(null);
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymentCheckMessage, setPaymentCheckMessage] = useState(null);
  const lastNotifiedTripIdRef = useRef(null);

  // 1. Restore availability preference and any ongoing trip when driver is approved
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

      if (driverId) {
        try {
          const ongoing = await getOngoingTripForDriver(driverId);
          if (isMounted && ongoing) {
            setActiveTripId(ongoing.id);
            setActiveTrip(ongoing);
          }
        } catch (err) {
          console.log('Error checking ongoing trip:', err);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isApproved, driverId]);

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

  // 2. Subscription to requested trips when the driver is available and does not have an active trip
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
        const newest = trips?.[0];
        if (newest?.id && lastNotifiedTripIdRef.current !== newest.id) {
          lastNotifiedTripIdRef.current = newest.id;
          notifyIncomingTripRequest(newest);
        }
      },
      (err) => {
        console.log('Error listening to incoming trips:', err);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAvailable, isApproved, driverId, vehicleInfo?.category, activeTripId]);

  // 3. Real-time subscription to the active trip document
  useEffect(() => {
    if (!activeTripId) {
      setActiveTrip(null);
      return undefined;
    }

    const unsubscribe = subscribeToActiveTrip(
      activeTripId,
      (trip) => {
        if (!trip) {
          setActiveTrip(null);
          setActiveTripId(null);
          setPaymentPreference(null);
          return;
        }
        setActiveTrip(trip);
        // If trip was cancelled, notify and return to map
        if (trip.status === TRIP_STATUS.CANCELLED) {
          setTripError(
            trip.cancelledBy === 'driver'
              ? 'Has cancelado el viaje.'
              : 'El pasajero canceló la solicitud.'
          );
          setActiveTrip(null);
          setActiveTripId(null);
          setPaymentPreference(null);
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

  // 3b. Real-time subscription to driver's paid trips for live platform balance calculation
  useEffect(() => {
    if (!isApproved || !driverId) {
      setPaidTrips([]);
      return undefined;
    }

    const unsubscribe = subscribeToDriverPaidTrips(
      driverId,
      (trips) => setPaidTrips(trips),
      (err) => console.log('Error subscribing to driver paid trips:', err)
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isApproved, driverId]);

  const balanceBreakdown = useMemo(() => calculateDriverBalance(paidTrips), [paidTrips]);
  const driverBalance = balanceBreakdown.balance;
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

  // 5. Reject trip handler
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

  // 6. Update active trip status (e.g. driver_arriving, in_progress)
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

  // 7. Complete trip handler
  const completeTrip = useCallback(
    async ({ distanceKm, durationMin, tip = 0, routeCoordinates = [] }) => {
      if (!activeTripId || !activeTrip) return null;
      setTripActionLoading(true);
      try {
        const category = activeTrip.category || vehicleInfo?.category || 'economy';
        const result = await completeTripService(activeTripId, {
          distanceKm: distanceKm ?? activeTrip.distanceKm,
          durationMin: durationMin ?? activeTrip.durationMin,
          category,
          tip,
          routeCoordinates,
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

  // 8. Mark cash as paid
  const confirmCashPayment = useCallback(async () => {
    if (!activeTripId) return;
    setTripActionLoading(true);
    setTripError(null);
    try {
      await markCashPaidService(activeTripId);
    } catch (err) {
      console.log('Error marking cash paid:', err);
      setTripError('Error al registrar el cobro en efectivo.');
    } finally {
      setTripActionLoading(false);
    }
  }, [activeTripId]);

  // 8b. Request Mercado Pago Checkout Pro preference from backend
  const requestMercadoPagoPreference = useCallback(async () => {
    if (!activeTripId || !activeTrip) return null;
    setTripActionLoading(true);
    setTripError(null);
    try {
      const amount = Math.round(Number(activeTrip.fare) || 0);
      const preference = await createPaymentPreferenceService({
        tripId: activeTripId,
        amount,
        description: `Viaje UberClone — ${activeTrip.origin?.name || 'Origen'} a ${
          activeTrip.destination?.name || 'Destino'
        }`,
      });
      setPaymentPreference(preference);
      return preference;
    } catch (err) {
      console.log('Error creating payment preference:', err);
      setTripError(
        err.message ||
          'No se pudo conectar con el servidor de pagos. Verifica que el backend esté activo.'
      );
      return null;
    } finally {
      setTripActionLoading(false);
    }
  }, [activeTripId, activeTrip]);

  // 8d. Actively verify Mercado Pago payment status via backend (fallback for webhook delays)
  const verifyMercadoPagoPayment = useCallback(
    async ({ silent = false } = {}) => {
      if (!activeTripId) return null;
      setPaymentVerifying(true);
      if (!silent) setTripError(null);
      try {
        const result = await checkTripPaymentStatusService(activeTripId);
        if (!result.found) {
          setPaymentCheckMessage(
            'Mercado Pago aún no registra ningún pago para este viaje. Completa el pago en Checkout Pro.'
          );
        } else if (result.paymentStatus === 'approved') {
          setPaymentCheckMessage('¡Pago aprobado por Mercado Pago!');
        } else if (result.paymentStatus === 'rejected') {
          setPaymentCheckMessage(
            `Mercado Pago rechazó el pago (${result.statusDetail || result.rawStatus}).`
          );
        } else {
          setPaymentCheckMessage(
            `Pago en estado "${result.rawStatus || 'pendiente'}". Vuelve a verificar en unos segundos.`
          );
        }
        return result;
      } catch (err) {
        console.log('Error verifying payment status:', err);
        if (!silent) {
          setTripError(err.message || 'No se pudo verificar el estado del pago.');
        }
        return null;
      } finally {
        setPaymentVerifying(false);
      }
    },
    [activeTripId]
  );
  // 8c. Switch payment method to cash (e.g., if card/Mercado Pago payment was rejected)
  const switchToCashPayment = useCallback(async () => {
    if (!activeTripId) return;
    setTripActionLoading(true);
    setTripError(null);
    try {
      await switchTripPaymentMethodService(activeTripId, PAYMENT_METHODS.CASH);
      setPaymentPreference(null);
    } catch (err) {
      console.log('Error switching to cash payment:', err);
      setTripError('Error al cambiar el método de pago a efectivo.');
    } finally {
      setTripActionLoading(false);
    }
  }, [activeTripId]);

  // 9. Reset active trip (called after reviewing summary to go back to home)
  const clearActiveTrip = useCallback(() => {
    setActiveTrip(null);
    setActiveTripId(null);
    setPaymentPreference(null);
    setTripError(null);
    setPaymentCheckMessage(null);
  }, []);

  const value = {
    isAvailable,
    isApproved,
    setAvailability,
    incomingTrips,
    activeTrip,
    activeTripId,
    paidTrips,
    driverBalance,
    balanceBreakdown,
    paymentPreference,
    tripActionLoading,
    tripError,
    acceptTrip,
    rejectTrip,
    changeTripStatus,
    completeTrip,
    confirmCashPayment,
    requestMercadoPagoPreference,
    verifyMercadoPagoPayment,
    paymentVerifying,
    paymentCheckMessage,
    switchToCashPayment,
    clearActiveTrip,
  };

  return <ActiveTripContext.Provider value={value}>{children}</ActiveTripContext.Provider>;
}

