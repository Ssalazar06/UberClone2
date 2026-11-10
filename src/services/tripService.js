import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig.js';
import { TRIP_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../constants/tripStatus.js';
import { calculateFare } from '../utils/calculateFare.js';

const COLLECTION = 'trips';

export const createTrip = async (tripId, tripData) => {
  const ref = doc(db, COLLECTION, tripId);
  await setDoc(ref, {
    tripId,
    passengerId: tripData.passengerId || 'anonymous_passenger',
    passengerName: tripData.passengerName || 'Pasajero',
    driverId: null,
    rejectedBy: [],
    origin: tripData.origin,
    destination: tripData.destination,
    distanceKm: tripData.distanceKm,
    durationMin: tripData.durationMin,
    category: tripData.category || 'economy',
    paymentMethod: tripData.paymentMethod || PAYMENT_METHODS.CASH,
    paymentStatus: PAYMENT_STATUS.PENDING,
    paymentId: null,
    tip: tripData.tip || 0,
    status: TRIP_STATUS.REQUESTED,
    rating: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return tripId;
};

/**
 * Gets a trip by its ID.
 */
export const getTrip = async (tripId) => {
  const snap = await getDoc(doc(db, COLLECTION, tripId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Real-time listener for incoming requested trips that match the driver's vehicle category.
 * Automatically filters out trips already rejected by this driver.
 */
export const subscribeToRequestedTrips = (category, currentDriverId, onChange, onError) => {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', TRIP_STATUS.REQUESTED),
    where('category', '==', category)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const trips = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((trip) => {
          const rejected = trip.rejectedBy || [];
          return !rejected.includes(currentDriverId);
        });
      onChange(trips);
    },
    (error) => {
      console.log('Error listening to requested trips:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Real-time listener for the active trip assigned to a driver.
 */
export const subscribeToActiveTrip = (tripId, onChange, onError) => {
  return onSnapshot(
    doc(db, COLLECTION, tripId),
    (snap) => {
      onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    (error) => {
      console.log('Error listening to active trip:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Atomically accepts a trip using runTransaction.
 */
export const acceptTrip = async (tripId, driverId) => {
  const tripRef = doc(db, COLLECTION, tripId);

  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(tripRef);

    if (!snap.exists()) {
      throw new Error('El viaje no existe.');
    }

    const data = snap.data();
    if (data.status !== TRIP_STATUS.REQUESTED) {
      throw new Error('El viaje ya no está disponible.');
    }

    transaction.update(tripRef, {
      driverId,
      status: TRIP_STATUS.ACCEPTED,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: snap.id, ...data, driverId, status: TRIP_STATUS.ACCEPTED };
  });
};

/** 
 * Rejects a trip from the driver's perspective.
 */
export const rejectTrip = async (tripId, driverId) => {
  const tripRef = doc(db, COLLECTION, tripId);
  const snap = await getDoc(tripRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const rejectedBy = Array.isArray(data.rejectedBy) ? data.rejectedBy : [];

  if (!rejectedBy.includes(driverId)) {
    rejectedBy.push(driverId);
  }

  await updateDoc(tripRef, {
    rejectedBy,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Updates a trip's lifecycle status.
*/
export const updateTripStatus = async (tripId, status, extraFields = {}) => {
  const tripRef = doc(db, COLLECTION, tripId);
  await updateDoc(tripRef, {
    status,
    ...extraFields,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Completes a trip and calculates the final fare.
 */
export const completeTrip = async (tripId, { distanceKm, durationMin, category, tip = 0 }) => {
  const { fare, commission, driverEarnings, commissionRate } = calculateFare({
    distanceKm,
    durationMin,
    category,
    tip,
  });

  const tripRef = doc(db, COLLECTION, tripId);
  await updateDoc(tripRef, {
    status: TRIP_STATUS.COMPLETED,
    fare,
    commission,
    driverEarnings,
    commissionRate,
    tip,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { fare, commission, driverEarnings, commissionRate };
};

/**
 * Marks a trip as paid in cash.
 */
export const markCashPaid = async (tripId) => {
  const tripRef = doc(db, COLLECTION, tripId);
  await updateDoc(tripRef, {
    status: TRIP_STATUS.PAID,
    paymentStatus: PAYMENT_STATUS.APPROVED,
    paymentMethod: PAYMENT_METHODS.CASH,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Retrieves past trips for a driver (history).
 */
export const getDriverTrips = async (driverId, maxTrips = 20) => {
  const q = query(
    collection(db, COLLECTION),
    where('driverId', '==', driverId),
    orderBy('createdAt', 'desc'),
    limit(maxTrips)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Removes a trip by its ID.
 */
export const removeTrip = async (tripId) => {
  await deleteDoc(doc(db, COLLECTION, tripId));
};

