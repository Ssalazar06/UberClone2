/**
 * Passenger simulator for testing the Driver app without a Passenger app.
 * Can be run from terminal:
 *   node scripts/simulatePassenger.mjs request
 *   node scripts/simulatePassenger.mjs request --category xl --payment mercadopago
 *   node scripts/simulatePassenger.mjs approve <driverId>
 *   node scripts/simulatePassenger.mjs cancel <tripId>
 *   node scripts/simulatePassenger.mjs pay <tripId>
 *   node scripts/simulatePassenger.mjs seed --driver <driverId> --count 15
 *   node scripts/simulatePassenger.mjs clear
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCkjz2mr3yUXYMK1HVBOA0yynvLPFZdCRE',
  authDomain: 'consumoapi-f84db.firebaseapp.com',
  projectId: 'consumoapi-f84db',
  storageBucket: 'consumoapi-f84db.firebasestorage.app',
  messagingSenderId: '187382199288',
  appId: '1:187382199288:web:9db9250ebc19017cd95c0d',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Popular locations in Medellín for realistic trips
const LOCATIONS = [
  { name: 'Parque Berrío', lat: 6.2494, lng: -75.5686, address: 'Cra 50 # 50-2, Centro, Medellín' },
  { name: 'Parque Lleras', lat: 6.2088, lng: -75.5678, address: 'Cra 37 # 8-12, El Poblado, Medellín' },
  { name: 'Laureles Parque 1', lat: 6.2423, lng: -75.5925, address: 'Av Nutibara # 72-10, Laureles, Medellín' },
  { name: 'CC Santafé', lat: 6.1969, lng: -75.5746, address: 'Cra 43A # 7 Sur-170, El Poblado, Medellín' },
  { name: 'Estación Estadio', lat: 6.2536, lng: -75.5878, address: 'Cl 47D # 70-10, Estadio, Medellín' },
  { name: 'CC Viva Envigado', lat: 6.1775, lng: -75.5912, address: 'Cra 48 # 32B Sur-139, Envigado' },
  { name: 'Terminal del Norte', lat: 6.2731, lng: -75.5694, address: 'Cra 64C # 78-580, Medellín' },
  { name: 'Aeropuerto Olaya Herrera', lat: 6.2201, lng: -75.5901, address: 'Cra 65 # 13-157, Medellín' },
];

const PASSENGERS = [
  'Laura Gómez',
  'Carlos Restrepo',
  'Mariana Henao',
  'Andrés Villa',
  'Valentina Zapata',
  'Felipe Jaramillo',
];

function parseArgs(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      flags[key] = val;
    }
  }
  return flags;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Haversine distance in km
function calculateDistance(loc1, loc2) {
  const R = 6371;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLon = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDist = R * c;
  // Apply 1.3 road curvature factor
  return Math.round(rawDist * 1.3 * 10) / 10;
}

async function requestTrip(flags) {
  let origin = getRandomItem(LOCATIONS);
  let destination = getRandomItem(LOCATIONS.filter((l) => l.name !== origin.name));

  const distanceKm = flags.distance ? parseFloat(flags.distance) : calculateDistance(origin, destination);
  const durationMin = flags.duration ? parseInt(flags.duration, 10) : Math.max(8, Math.round((distanceKm / 25) * 60));
  const category = flags.category || 'economy';
  const paymentMethod = flags.payment || 'cash';
  const passengerName = flags.passenger || getRandomItem(PASSENGERS);

  const tripId = `trip_${Date.now()}`;

  const tripData = {
    tripId,
    passengerId: `pass_${Date.now().toString(36)}`,
    passengerName,
    driverId: null,
    rejectedBy: [],
    origin: {
      lat: origin.lat,
      lng: origin.lng,
      address: origin.address,
      name: origin.name,
    },
    destination: {
      lat: destination.lat,
      lng: destination.lng,
      address: destination.address,
      name: destination.name,
    },
    distanceKm,
    durationMin,
    category,
    paymentMethod,
    paymentStatus: 'pending',
    paymentId: null,
    tip: flags.tip ? parseInt(flags.tip, 10) : 0,
    status: 'requested',
    rating: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'trips', tripId), tripData);

  console.log(' Solicitud de viaje simulada creada con éxito:');
  console.log(`   ID: ${tripId}`);
  console.log(`   Pasajero: ${passengerName}`);
  console.log(`   Categoría: ${category}`);
  console.log(`   Ruta: ${origin.name} -> ${destination.name}`);
  console.log(`   Distancia: ${distanceKm} km | Duración: ${durationMin} min`);
  console.log(`   Método de pago: ${paymentMethod}`);
  console.log('\n  La app del conductor disponible escuchará esta solicitud en tiempo real.');
}

async function approveDriver(driverId) {
  if (!driverId) {
    console.error(' Error: debes proporcionar el driverId. Ejemplo: node scripts/simulatePassenger.mjs approve 1000123456');
    return;
  }
  const ref = doc(db, 'drivers', driverId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.error(` No se encontró conductor con id "${driverId}".`);
    return;
  }
  await updateDoc(ref, {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });
  console.log(` Conductor "${driverId}" aprobado exitosamente en Firestore. Ya puede ponerse Disponible.`);
}

async function cancelTrip(tripId) {
  if (!tripId) {
    console.error(' Error: debes indicar el tripId.');
    return;
  }
  await updateDoc(doc(db, 'trips', tripId), {
    status: 'cancelled',
    cancelledBy: 'passenger',
    updatedAt: serverTimestamp(),
  });
  console.log(` Viaje "${tripId}" cancelado por el pasajero.`);
}

async function payTrip(tripId, flags) {
  if (!tripId) {
    console.error(' Error: debes indicar el tripId.');
    return;
  }
  const status = flags.status || 'approved';
  await updateDoc(doc(db, 'trips', tripId), {
    status: 'paid',
    paymentStatus: status,
    paymentId: `pay_${Date.now()}`,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log(` Pago simulado para viaje "${tripId}" con estado: ${status}`);
}

async function rateTrip(tripId, ratingValue) {
  const rating = parseInt(ratingValue, 10) || 5;
  await updateDoc(doc(db, 'trips', tripId), {
    rating,
    updatedAt: serverTimestamp(),
  });
  console.log(` Calificación de ${rating} estrellas guardada para el viaje "${tripId}".`);
}

async function seedHistory(flags) {
  const driverId = flags.driver;
  if (!driverId) {
    console.error(' Error: indica el driverId con --driver <id>');
    return;
  }
  const count = parseInt(flags.count, 10) || 12;
  console.log(` Generando ${count} viajes históricos para el conductor ${driverId}...`);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const tripId = `hist_${now}_${i}`;
    const origin = getRandomItem(LOCATIONS);
    const destination = getRandomItem(LOCATIONS.filter((l) => l.name !== origin.name));
    const distanceKm = calculateDistance(origin, destination);
    const durationMin = Math.max(8, Math.round((distanceKm / 25) * 60));
    const category = getRandomItem(['economy', 'economy', 'xl', 'premium']);
    const paymentMethod = getRandomItem(['cash', 'mercadopago']);
    const tip = Math.random() > 0.7 ? getRandomInt(1, 4) * 1000 : 0;

    // Distribute dates: 40% today, 40% this week, 20% this month
    const randDays = Math.random() < 0.4 ? 0 : Math.random() < 0.8 ? getRandomInt(1, 6) : getRandomInt(7, 25);
    const tripDate = new Date(now - randDays * dayMs - getRandomInt(10, 400) * 60 * 1000);

    // Calculate approximate fare
    const mult = category === 'xl' ? 1.4 : category === 'premium' ? 1.8 : 1.0;
    const raw = (3500 + distanceKm * 1200 + durationMin * 250) * mult;
    const fare = Math.round(Math.max(raw, 6000) / 100) * 100;
    const commission = Math.round(fare * 0.2);
    const driverEarnings = fare - commission + tip;

    await setDoc(doc(db, 'trips', tripId), {
      tripId,
      driverId,
      passengerId: `pass_${i}`,
      passengerName: getRandomItem(PASSENGERS),
      origin,
      destination,
      distanceKm,
      durationMin,
      category,
      paymentMethod,
      paymentStatus: 'approved',
      paymentId: `pay_sim_${i}`,
      fare,
      commission,
      commissionRate: 0.2,
      tip,
      driverEarnings,
      status: 'paid',
      rating: getRandomInt(4, 5),
      createdAt: Timestamp.fromDate(tripDate),
      completedAt: Timestamp.fromDate(new Date(tripDate.getTime() + durationMin * 60 * 1000)),
      paidAt: Timestamp.fromDate(new Date(tripDate.getTime() + durationMin * 60 * 1000 + 120000)),
    });
  }

  console.log(` ${count} viajes creados exitosamente. Podrás verlos en Historial y Ganancias.`);
}

async function clearTrips() {
  const snap = await getDocs(collection(db, 'trips'));
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
  console.log(` Eliminados ${snap.size} viajes de prueba de la colección "trips".`);
}

async function listTrips() {
  const snap = await getDocs(collection(db, 'trips'));
  if (snap.empty) {
    console.log(' No hay viajes en la colección "trips".');
    return;
  }
  console.log(' Viajes en Firestore:');
  for (const d of snap.docs) {
    const data = d.data();
    console.log(
      `   - ID: ${d.id} | Estado: ${data.status} | Pago: ${data.paymentMethod} (${data.paymentStatus}) | Conductor: ${data.driverId || 'ninguno'}`
    );
  }
}

async function cancelActiveTrips() {
  const snap = await getDocs(collection(db, 'trips'));
  let count = 0;
  for (const d of snap.docs) {
    const status = d.data()?.status;
    if (!['paid', 'cancelled', 'rejected'].includes(status)) {
      await updateDoc(d.ref, {
        status: 'cancelled',
        cancelledBy: 'simulator',
        updatedAt: serverTimestamp(),
      });
      count += 1;
    }
  }
  console.log(` Cancelados ${count} viajes activos/pendientes. La app volverá al mapa.`);
}

async function listDrivers() {
  const snap = await getDocs(collection(db, 'drivers'));
  if (snap.empty) {
    console.log(' No hay conductores registrados en la colección "drivers".');
    return;
  }
  console.log(' Conductores en Firestore:');
  for (const d of snap.docs) {
    const data = d.data();
    const name = data.personalInfo?.fullName || 'Sin nombre';
    const category = data.vehicleInfo?.category || 'economy';
    const plate = data.vehicleInfo?.licensePlate || 'Sin placa';
    console.log(`   - ID: ${d.id} | Nombre: ${name} | Estado: ${data.status} | Categoría: ${category} | Placa: ${plate} | Disponible: ${Boolean(data.isAvailable)}`);
  }
}

async function main() {
  const [,, command, ...rest] = process.argv;
  const flags = parseArgs(rest);

  try {
    switch (command) {
      case 'request':
        await requestTrip(flags);
        break;
      case 'approve':
        await approveDriver(rest[0]);
        break;
      case 'cancel':
        await cancelTrip(rest[0]);
        break;
      case 'pay':
        await payTrip(rest[0], flags);
        break;
      case 'rate':
        await rateTrip(rest[0], rest[1]);
        break;
      case 'seed':
        await seedHistory(flags);
        break;
      case 'clear':
        await clearTrips();
        break;
      case 'trips':
        await listTrips();
        break;
      case 'cancel-active':
        await cancelActiveTrips();
        break;
      case 'drivers':
        await listDrivers();
        break;
      default:
        console.log(`
Uso del Simulador de Pasajeros (UberClone Conductor):
  node scripts/simulatePassenger.mjs drivers
  node scripts/simulatePassenger.mjs trips
  node scripts/simulatePassenger.mjs cancel-active
  node scripts/simulatePassenger.mjs approve <driverId>
  node scripts/simulatePassenger.mjs request [--category economy|xl|premium] [--payment cash|mercadopago] [--tip 2000]
  node scripts/simulatePassenger.mjs cancel <tripId>
  node scripts/simulatePassenger.mjs pay <tripId> [--status approved|rejected]
  node scripts/simulatePassenger.mjs rate <tripId> [1-5]
  node scripts/simulatePassenger.mjs seed --driver <driverId> [--count 15]
  node scripts/simulatePassenger.mjs clear
        `);
    }
  } catch (err) {
    console.error('Error ejecutando simulador:', err);
  } finally {
    process.exit(0);
  }
}

main();

