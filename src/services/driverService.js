import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from '../config/firebaseConfig';

const COLLECTION = 'drivers';

export const saveDriver = async (driverId, driverData) => {
  const ref = doc(db, COLLECTION, driverId);
  const snap = await getDoc(ref);

  await setDoc(
    ref,
    {
      ...driverData,
      driverId,
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
};

export const getDriver = async (driverId) => {
  const snap = await getDoc(doc(db, COLLECTION, driverId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const findDriverByLicensePlate = async (licensePlate, excludeDriverId) => {
  const q = query(
    collection(db, COLLECTION),
    where('vehicleInfo.licensePlate', '==', licensePlate),
    limit(2)
  );
  const snapshot = await getDocs(q);
  const match = snapshot.docs.find((d) => d.id !== excludeDriverId);
  return match ? { id: match.id, ...match.data() } : null;
};

export const updateDriverStatus = async (driverId, status) => {
  await updateDoc(doc(db, COLLECTION, driverId), { status, updatedAt: serverTimestamp() });
};

export const subscribeToDriver = (driverId, onChange, onError) =>
  onSnapshot(
    doc(db, COLLECTION, driverId),
    (snap) => onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  );

export const removeDriver = async (driverId) => {
  await deleteDoc(doc(db, COLLECTION, driverId));
};

