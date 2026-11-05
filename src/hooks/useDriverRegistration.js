import { useContext } from 'react';

import { DriverRegistrationContext } from '../context/DriverRegistrationContext';

export default function useDriverRegistration() {
  const context = useContext(DriverRegistrationContext);
  if (!context) {
    throw new Error('useDriverRegistration debe usarse dentro de <DriverRegistrationProvider>');
  }
  return context;
}

