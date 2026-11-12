import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, setDoc, startAfter, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig.js';
import { TRIP_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../constants/tripStatus.js';
import { calculateFare } from '../utils/calculateFare.js';
import { fetchDistanceMatrix } from '../utils/routeUtils.js';

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
 * Uses a single-field Firestore query to avoid composite index requirements and filters in memory.
 */
export const subscribeToRequestedTrips = (category, currentDriverId, onChange, onError) => {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', TRIP_STATUS.REQUESTED)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const trips = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((trip) => {
          const rejected = Array.isArray(trip.rejectedBy) ? trip.rejectedBy : [];
          if (currentDriverId && rejected.includes(currentDriverId)) {
            return false;
          }
          if (category && trip.category && trip.category !== category) {
            return false;
          }
          return true;
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
 * Also queries Google Distance Matrix API once upon acceptance to refresh distanceKm/durationMin.
 */
export const acceptTrip = async (tripId, driverId) => {
  const tripRef = doc(db, COLLECTION, tripId);

  const acceptedTrip = await runTransaction(db, async (transaction) => {
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

  // Rule 5: Call Distance Matrix API once when accepting the trip
  if (acceptedTrip?.origin && acceptedTrip?.destination) {
    try {
      const metrics = await fetchDistanceMatrix(acceptedTrip.origin, acceptedTrip.destination);
      if (metrics?.distanceKm && metrics?.durationMin) {
        await updateDoc(tripRef, {
          distanceKm: metrics.distanceKm,
          durationMin: metrics.durationMin,
          updatedAt: serverTimestamp(),
        });
        acceptedTrip.distanceKm = metrics.distanceKm;
        acceptedTrip.durationMin = metrics.durationMin;
      }
    } catch (err) {
      console.log('Distance Matrix on accept skipped:', err);
    }
  }

  return acceptedTrip;
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
export const completeTrip = async (
  tripId,
  { distanceKm, durationMin, category, tip = 0, routeCoordinates = [] }
) => {
  const { fare, commission, driverEarnings, commissionRate } = calculateFare({
    distanceKm,
    durationMin,
    category,
    tip,
  });

  // Downsample polyline coordinates if needed to keep Firestore document compact
  const maxPoints = 60;
  let savedRoute = Array.isArray(routeCoordinates) ? routeCoordinates : [];
  if (savedRoute.length > maxPoints) {
    const step = Math.ceil(savedRoute.length / maxPoints);
    savedRoute = savedRoute.filter((_, idx) => idx % step === 0 || idx === savedRoute.length - 1);
  }

  const tripRef = doc(db, COLLECTION, tripId);
  await updateDoc(tripRef, {
    status: TRIP_STATUS.COMPLETED,
    fare,
    commission,
    driverEarnings,
    commissionRate,
    tip,
    ...(savedRoute.length > 0 ? { routeCoordinates: savedRoute } : {}),
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { fare, commission, driverEarnings, commissionRate };
};

/**
 * Finds an ongoing trip for a driver (useful to restore active trip state on app reload).
 */
export const getOngoingTripForDriver = async (driverId) => {
  if (!driverId) return null;
  const activeStatuses = [
    TRIP_STATUS.ACCEPTED,
    TRIP_STATUS.DRIVER_ARRIVING,
    TRIP_STATUS.IN_PROGRESS,
    TRIP_STATUS.COMPLETED,
  ];
  const q = query(
    collection(db, COLLECTION),
    where('driverId', '==', driverId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const matchingDoc = snapshot.docs.find((d) => activeStatuses.includes(d.data()?.status));
  return matchingDoc ? { id: matchingDoc.id, ...matchingDoc.data() } : null;
};

const DEMO_LOCATIONS = [
  { name: 'Parque Berrío', lat: 6.2494, lng: -75.5686, address: 'Cra 50 # 50-2, Centro, Medellín' },
  { name: 'Parque Lleras', lat: 6.2088, lng: -75.5678, address: 'Cra 37 # 8-12, El Poblado, Medellín' },
  { name: 'Laureles Parque 1', lat: 6.2423, lng: -75.5925, address: 'Av Nutibara # 72-10, Laureles, Medellín' },
  { name: 'CC Santafé', lat: 6.1969, lng: -75.5746, address: 'Cra 43A # 7 Sur-170, El Poblado, Medellín' },
  { name: 'Estación Estadio', lat: 6.2536, lng: -75.5878, address: 'Cl 47D # 70-10, Estadio, Medellín' },
];

const DEMO_PASSENGERS = ['Laura Gómez', 'Carlos Restrepo', 'Mariana Henao', 'Andrés Villa'];

/**
 * Creates a simulated incoming trip in Firestore matching the driver's category.
 * Uses Google Distance Matrix API (or Haversine fallback) once on creation.
 */
export const createSimulatedTrip = async ({ category = 'economy', paymentMethod = 'cash' } = {}) => {
  const originIdx = Math.floor(Math.random() * DEMO_LOCATIONS.length);
  const destIdx = (originIdx + 1 + Math.floor(Math.random() * (DEMO_LOCATIONS.length - 1))) % DEMO_LOCATIONS.length;
  const origin = DEMO_LOCATIONS[originIdx];
  const destination = DEMO_LOCATIONS[destIdx];
  const passengerName = DEMO_PASSENGERS[Math.floor(Math.random() * DEMO_PASSENGERS.length)];
  const tripId = `trip_${Date.now()}`;

  // Rule 5: Call Distance Matrix API once when creating the request
  const { distanceKm, durationMin } = await fetchDistanceMatrix(origin, destination);

  await createTrip(tripId, {
    passengerId: `sim_${Date.now()}`,
    passengerName,
    origin,
    destination,
    distanceKm,
    durationMin,
    category: category || 'economy',
    paymentMethod,
    tip: 1000,
  });

  return tripId;
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
 * Switches the payment method of a completed trip (e.g. fallback to cash if card was rejected).
 */
export const switchTripPaymentMethod = async (tripId, paymentMethod) => {
  const tripRef = doc(db, COLLECTION, tripId);
  await updateDoc(tripRef, {
    paymentMethod,
    paymentStatus: PAYMENT_STATUS.PENDING,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Real-time listener for all paid trips of a driver to compute live platform balance.
 * Uses a single-field query to avoid Firestore composite index requirements.
 */
export const subscribeToDriverPaidTrips = (driverId, onChange, onError) => {
  if (!driverId) return () => {};

  const q = query(
    collection(db, COLLECTION),
    where('driverId', '==', driverId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const paidTrips = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (t) => t.status === TRIP_STATUS.PAID || t.paymentStatus === PAYMENT_STATUS.APPROVED
        );
      onChange(paidTrips);
    },
    (error) => {
      console.log('Error listening to driver paid trips:', error);
      if (onError) onError(error);
    }
  );
};

const getTripMillis = (trip) => {
  const raw = trip?.createdAt || trip?.completedAt || trip?.paidAt;
  if (!raw) return 0;
  if (typeof raw.toMillis === 'function') return raw.toMillis();
  if (typeof raw.seconds === 'number') return raw.seconds * 1000;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getDriverTripsPage = async (driverId, { pageSize = 20, lastDoc = null, offset = 0 } = {}) => {
  if (!driverId) return { trips: [], lastDoc: null, hasMore: false, nextOffset: 0 };

  try {
    const constraints = [
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc'),
      ...(lastDoc ? [startAfter(lastDoc)] : []),
      limit(pageSize),
    ];
    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    const trips = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return {
      trips,
      lastDoc: nextCursor,
      hasMore: snapshot.docs.length === pageSize,
      nextOffset: offset + trips.length,
    };
  } catch {
    const fallbackSnap = await getDocs(
      query(collection(db, COLLECTION), where('driverId', '==', driverId))
    );
    const allTrips = fallbackSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => getTripMillis(b) - getTripMillis(a));
    const slice = allTrips.slice(offset, offset + pageSize);
    return {
      trips: slice,
      lastDoc: null,
      hasMore: offset + pageSize < allTrips.length,
      nextOffset: offset + slice.length,
    };
  }
};

export const getDriverTrips = async (driverId, maxTrips = 20) => {
  const { trips } = await getDriverTripsPage(driverId, { pageSize: maxTrips });
  return trips;
};

export const seedDemoDriverTrips = async (driverId, count = 12) => {
  if (!driverId) return 0;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const categories = ['economy', 'economy', 'xl', 'premium'];
  const methods = [PAYMENT_METHODS.CASH, PAYMENT_METHODS.MERCADO_PAGO];

  for (let i = 0; i < count; i++) {
    const originIdx = i % DEMO_LOCATIONS.length;
    const destIdx = (i + 2) % DEMO_LOCATIONS.length;
    const origin = DEMO_LOCATIONS[originIdx];
    const destination = DEMO_LOCATIONS[destIdx];
    const distanceKm = Math.round((2.5 + (i % 7) * 1.4) * 10) / 10;
    const durationMin = Math.max(8, Math.round((distanceKm / 25) * 60));
    const category = categories[i % categories.length];
    const paymentMethod = methods[i % methods.length];
    const tip = i % 3 === 0 ? 2000 : 0;
    const daysAgo = i < 4 ? 0 : i < 8 ? (i % 5) + 1 : (i % 18) + 7;
    const tripDate = new Date(now - daysAgo * dayMs - (i + 1) * 35 * 60 * 1000);
    const pricing = calculateFare({ distanceKm, durationMin, category, tip });
    const tripId = `seed_${now}_${i}`;

    const midLat = (origin.lat + destination.lat) / 2 + 0.0025;
    const midLng = (origin.lng + destination.lng) / 2 - 0.002;

    await setDoc(doc(db, COLLECTION, tripId), {
      tripId,
      driverId,
      passengerId: `pass_seed_${i}`,
      passengerName: DEMO_PASSENGERS[i % DEMO_PASSENGERS.length],
      origin,
      destination,
      distanceKm,
      durationMin,
      category,
      paymentMethod,
      paymentStatus: PAYMENT_STATUS.APPROVED,
      paymentId: `pay_seed_${now}_${i}`,
      fare: pricing.fare,
      commission: pricing.commission,
      commissionRate: pricing.commissionRate,
      tip,
      driverEarnings: pricing.driverEarnings,
      status: TRIP_STATUS.PAID,
      rating: i % 4 === 0 ? 4 : 5,
      routeCoordinates: [
        { latitude: origin.lat, longitude: origin.lng },
        { latitude: midLat, longitude: midLng },
        { latitude: destination.lat, longitude: destination.lng },
      ],
      createdAt: Timestamp.fromDate(tripDate),
      completedAt: Timestamp.fromDate(new Date(tripDate.getTime() + durationMin * 60 * 1000)),
      paidAt: Timestamp.fromDate(new Date(tripDate.getTime() + (durationMin + 2) * 60 * 1000)),
    });
  }

  return count;
};

export const removeTrip = async (tripId) => {
  await deleteDoc(doc(db, COLLECTION, tripId));
};

