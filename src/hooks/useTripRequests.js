import { useCallback, useEffect, useRef, useState } from 'react';
import useActiveTrip from './useActiveTrip.js';

const REQUEST_TIMEOUT_SECONDS = 15;

/**
 * Custom hook that manages the currently displayed incoming trip request
 * and its mandatory 15-second countdown timer.
 *
 * Rules from specification:
 * - Uses useEffect with cleanup function (clearInterval) to prevent memory leaks.
 * - Uses useCallback for accept and reject handlers.
 * - Automatically rejects the trip if the timer reaches 0.
 */
export default function useTripRequests() {
  const {
    incomingTrips,
    acceptTrip,
    rejectTrip,
    tripActionLoading,
    isAvailable,
    activeTrip,
  } = useActiveTrip();

  const currentRequest =
    isAvailable && !activeTrip && incomingTrips.length > 0
      ? incomingTrips[0]
      : null;

  const currentRequestId = currentRequest?.id || currentRequest?.tripId || null;

  const [secondsLeft, setSecondsLeft] = useState(REQUEST_TIMEOUT_SECONDS);
  const timerRef = useRef(null);

  // Reset and start 15-second countdown whenever a new request arrives
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!currentRequestId) {
      setSecondsLeft(REQUEST_TIMEOUT_SECONDS);
      return undefined;
    }

    setSecondsLeft(REQUEST_TIMEOUT_SECONDS);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Auto-reject when timer expires
          rejectTrip(currentRequestId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Mandatory cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentRequestId, rejectTrip]);

  const handleAccept = useCallback(async () => {
    if (!currentRequestId) return false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return await acceptTrip(currentRequestId);
  }, [currentRequestId, acceptTrip]);

  const handleReject = useCallback(async () => {
    if (!currentRequestId) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await rejectTrip(currentRequestId);
  }, [currentRequestId, rejectTrip]);

  return {
    currentRequest,
    secondsLeft,
    totalSeconds: REQUEST_TIMEOUT_SECONDS,
    isProcessing: tripActionLoading,
    handleAccept,
    handleReject,
  };
}
