// AI-assisted: see docs/AI_LOG.md #2
import {
  MAX_PASSENGER_CAPACITY,
  MIN_CAPACITY_BY_CATEGORY,
  MIN_VEHICLE_YEAR,
  VEHICLE_CATEGORY_OPTIONS,
  VEHICLE_COLOR_OPTIONS,
} from '../../data/registrationOptions.js';

// Colombian private vehicle plate: 3 letters + 3 digits (ABC123)
const PLATE_REGEX = /^[A-Z]{3}\d{3}$/;
const ONLY_DIGITS_REGEX = /^\d+$/;

const asTrimmedString = (value) => (value ?? '').toString().trim();

/**
 * Pure validation for Tab 2 (vehicle info). Messages are in Spanish (UI).
 *
 * - category: required, one of VEHICLE_CATEGORY_OPTIONS.
 * - licensePlate: required, converted to uppercase BEFORE validating, format ABC123.
 * - brand / model: required, max 30 chars each.
 * - year: required, 4 digits, between MIN_VEHICLE_YEAR and the current year.
 * - color: required, one of VEHICLE_COLOR_OPTIONS.
 * - passengerCapacity: required, integer; cross validation with category (xl >= 6).
 * - vehiclePhotoUri: required (photo where the plate is visible).
 *
 * @param {Partial<typeof import('../../data/registrationData').initialVehicleInfo>} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateVehicleInfo(data = {}) {
  const errors = {};

  // 1. Category (dropdown)
  const validCategories = VEHICLE_CATEGORY_OPTIONS.map((option) => option.value);
  if (!data.category) {
    errors.category = 'Selecciona la categoría del vehículo';
  } else if (!validCategories.includes(data.category)) {
    errors.category = 'La categoría seleccionada no es válida';
  }

  // 2. License plate (uppercase before validating)
  const licensePlate = asTrimmedString(data.licensePlate).toUpperCase();
  if (!licensePlate) {
    errors.licensePlate = 'La placa es obligatoria';
  } else if (!PLATE_REGEX.test(licensePlate)) {
    errors.licensePlate = 'La placa debe tener 3 letras y 3 números (ej. ABC123)';
  }

  // 3. Brand
  const brand = asTrimmedString(data.brand);
  if (!brand) {
    errors.brand = 'La marca es obligatoria';
  } else if (brand.length > 30) {
    errors.brand = 'La marca no puede superar los 30 caracteres';
  }

  // 4. Model
  const model = asTrimmedString(data.model);
  if (!model) {
    errors.model = 'El modelo es obligatorio';
  } else if (model.length > 30) {
    errors.model = 'El modelo no puede superar los 30 caracteres';
  }

  // 5. Year
  const currentYear = new Date().getFullYear();
  const yearText = asTrimmedString(data.year);
  const year = Number(yearText);
  if (!yearText) {
    errors.year = 'El año es obligatorio';
  } else if (!/^\d{4}$/.test(yearText)) {
    errors.year = 'El año debe tener 4 dígitos (ej. 2022)';
  } else if (year > currentYear) {
    errors.year = `El año no puede ser mayor a ${currentYear}`;
  } else if (year < MIN_VEHICLE_YEAR) {
    errors.year = `El año debe ser ${MIN_VEHICLE_YEAR} o posterior`;
  }

  // 6. Color (dropdown)
  const validColors = VEHICLE_COLOR_OPTIONS.map((option) => option.value);
  if (!data.color) {
    errors.color = 'Selecciona el color del vehículo';
  } else if (!validColors.includes(data.color)) {
    errors.color = 'El color seleccionado no es válido';
  }

  // 7. Passenger capacity + cross validation with category
  const capacityText = asTrimmedString(data.passengerCapacity);
  const capacity = Number(capacityText);
  const minCapacity = MIN_CAPACITY_BY_CATEGORY[data.category] ?? 1;
  if (!capacityText) {
    errors.passengerCapacity = 'La capacidad de pasajeros es obligatoria';
  } else if (!ONLY_DIGITS_REGEX.test(capacityText) || capacity <= 0) {
    errors.passengerCapacity = 'La capacidad debe ser un número entero mayor a 0';
  } else if (capacity > MAX_PASSENGER_CAPACITY) {
    errors.passengerCapacity = `La capacidad no puede ser mayor a ${MAX_PASSENGER_CAPACITY} pasajeros`;
  } else if (capacity < minCapacity) {
    errors.passengerCapacity = `La categoría XL exige una capacidad mínima de ${minCapacity} pasajeros`;
  }

  // 8. Vehicle photo
  if (!asTrimmedString(data.vehiclePhotoUri)) {
    errors.vehiclePhotoUri = 'La foto del vehículo (con la placa visible) es obligatoria';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
