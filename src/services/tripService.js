<<<<<<< HEAD
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

=======
import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
import { db } from '../config/firebaseConfig.js';
import { TRIP_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../constants/tripStatus.js';
import { calculateFare } from '../utils/calculateFare.js';

const COLLECTION = 'trips';

<<<<<<< HEAD
/**
 * Creates a trip request (used by simulator or testing).
 */
=======
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
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

<<<<<<< HEAD
/**
 * Gets a trip by its ID.
 */
=======
/* Gets a trip by its ID. */

>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
export const getTrip = async (tripId) => {
  const snap = await getDoc(doc(db, COLLECTION, tripId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

<<<<<<< HEAD
/**
 * Real-time listener for incoming requested trips that match the driver's vehicle category.
 * Automatically filters out trips already rejected by this driver.
=======
/*
 * Real-time listener for incoming requested trips that match the driver's vehicle category.
 * Automatically filters out trips already rejected by this driver.
 * Returns unsubscribe cleanup function for useEffect.
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
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
<<<<<<< HEAD
=======
 * Ensures that if two drivers try to accept the same trip simultaneously,
 * or if the trip was cancelled/expired, only one succeeds.
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
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
<<<<<<< HEAD
 * Rejects a trip from the driver's perspective.
=======
 * Rejects a trip from the driver's perspective or when the 15s timer expires.
 * Adds driverId to rejectedBy array so it won't appear again for this driver.
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
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
<<<<<<< HEAD
 * Updates a trip's lifecycle status.
=======
 * Updates a trip's lifecycle status (e.g. driver_arriving, in_progress).
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
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
<<<<<<< HEAD
 * Completes a trip and calculates the final fare.
=======
 * Completes a trip and calculates the final fare, platform commission,
 * and driver earnings using calculateFare.
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
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
<<<<<<< HEAD
 * Removes a trip by its ID.
=======
 * Removes a trip by its ID (useful for simulator cleanup).
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
 */
export const removeTrip = async (tripId) => {
  await deleteDoc(doc(db, COLLECTION, tripId));
};

