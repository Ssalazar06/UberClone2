export const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
  { label: 'Otro', value: 'other' },
];

export const VEHICLE_CATEGORY_OPTIONS = [
  { label: 'Económico', value: 'economy' },
  { label: 'XL', value: 'xl' },
  { label: 'Premium', value: 'premium' },
];

export const VEHICLE_COLOR_OPTIONS = [
  { label: 'Blanco', value: 'white' },
  { label: 'Negro', value: 'black' },
  { label: 'Gris', value: 'gray' },
  { label: 'Plata', value: 'silver' },
  { label: 'Rojo', value: 'red' },
  { label: 'Azul', value: 'blue' },
  { label: 'Otro', value: 'other' },
];

/** Minimum passengers required per category */
export const MIN_CAPACITY_BY_CATEGORY = {
  economy: 1,
  xl: 6,
  premium: 1,
};

export const MAX_PASSENGER_CAPACITY = 15;
export const MIN_VEHICLE_YEAR = 1990;
export const MIN_DRIVER_AGE = 18;

/** A technical-mechanical inspection is only required after 5 years */
export const MECHANICAL_INSPECTION_MIN_VEHICLE_AGE = 5;

/** Registration status */
export const REGISTRATION_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const REGISTRATION_STATUS_LABELS = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

/** Returns the Spanish label of an option */
export const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label ?? '';
