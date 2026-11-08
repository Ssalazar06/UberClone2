<<<<<<< HEAD

=======
>>>>>>> 7fb8422e2b1648e8b5d68ded008f2ce42ac86170
import { useContext } from 'react';
import { ActiveTripContext } from '../context/ActiveTripContext.js';

export default function useActiveTrip() {
  const context = useContext(ActiveTripContext);
  if (!context) {
    throw new Error('useActiveTrip debe usarse dentro de un <ActiveTripProvider>');
  }
  return context;
}

