import { Platform, Vibration } from 'react-native';
import { formatCOP } from '../utils/routeUtils.js';
import { calculateFare } from '../utils/calculateFare.js';

export const notifyIncomingTripRequest = async (trip) => {
  if (!trip) return;

  if (Platform.OS !== 'web') {
    try {
      Vibration.vibrate([0, 350, 150, 350]);
    } catch {
    }
  }

  const estimate = calculateFare({
    distanceKm: trip.distanceKm || 0,
    durationMin: trip.durationMin || 0,
    category: trip.category || 'economy',
    tip: trip.tip || 0,
  });

  const title = 'Nueva solicitud de viaje';
  const body = `${trip.origin?.name || 'Origen'} → ${
    trip.destination?.name || 'Destino'
  } · Ganancia neta: ${formatCOP(estimate.driverEarnings)}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (window.Notification.permission === 'granted') {
      new window.Notification(title, { body });
    }
  }
};

