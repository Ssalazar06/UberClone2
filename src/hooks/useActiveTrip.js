import { useContext } from 'react';
import { ActiveTripContext } from '../context/ActiveTripContext.js';

export default function useActiveTrip() {
  const context = useContext(ActiveTripContext);
  if (!context) {
    throw new Error('useActiveTrip debe usarse dentro de un <ActiveTripProvider>');
  }
  return context;
}

