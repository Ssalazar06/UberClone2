// AI-assisted: see docs/AI_LOG.md #2
import { MECHANICAL_INSPECTION_MIN_VEHICLE_AGE, MIN_VEHICLE_YEAR } from '../../data/registrationOptions.js';
import { PLATFORM_COMMISSION_PERCENT } from '../../config/pricing.js';
import { isDateAfterToday, parseLocalDate } from '../dateUtils.js';

const ONLY_DIGITS_REGEX = /^\d+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const asTrimmedString = (value) => (value ?? '').toString().trim();

/**
 * Determines if the vehicle requires the mechanical inspection ("Revisión Técnico-Mecánica")
 * based on its model year. Vehicles with 5 or more years of age require it by law.
 * If the vehicle year in Tab 2 is not yet valid, returns true so the requirement is visible.
 *
 * @param {string | number} vehicleYear
 * @param {number} [currentYear]
 * @returns {boolean}
 */
export function doesVehicleRequireMechanicalInspection(
  vehicleYear,
  currentYear = new Date().getFullYear()
) {
  const yearText = asTrimmedString(vehicleYear);
  const yearNumber = Number(yearText);
  if (!/^\d{4}$/.test(yearText) || yearNumber < MIN_VEHICLE_YEAR || yearNumber > currentYear) {
    return true;
  }
  return currentYear - yearNumber >= MECHANICAL_INSPECTION_MIN_VEHICLE_AGE;
}

/**
 * Pure validation for Tab 3 (documents & payment info). Messages are in Spanish (UI).
 *
 * Rules from specification:
 * - driverLicenseNumber: required, numeric (6 to 12 digits).
 * - driverLicensePhotoUri: required.
 * - driverLicenseExpiryDate: required, valid date strictly after today.
 * - soatPhotoUri: required.
 * - soatExpiryDate: required, valid date strictly after today.
 * - mechanicalInspectionPhotoUri & mechanicalInspectionExpiryDate:
 *   required if the vehicle requires inspection according to its model year (5+ years old);
 *   expiry date must be strictly after today.
 * - mercadoPagoEmail: required, valid email format (@ and domain).
 * - termsAccepted: required boolean true (checkbox with visible commission percentage).
 *
 * @param {Partial<typeof import('../../data/registrationData').initialDocumentsInfo>} data
 * @param {Partial<typeof import('../../data/registrationData').initialVehicleInfo>} [vehicleInfo]
 * @returns {{ isValid: boolean, requiresMechanicalInspection: boolean, errors: Record<string, string> }}
 */
export function validateDocumentsInfo(data = {}, vehicleInfo = {}) {
  const errors = {};
  const requiresMechanicalInspection = doesVehicleRequireMechanicalInspection(vehicleInfo?.year);

  // 1. Driver license number
  const licenseNumber = asTrimmedString(data.driverLicenseNumber);
  if (!licenseNumber) {
    errors.driverLicenseNumber = 'El número de licencia de conducción es obligatorio';
  } else if (!ONLY_DIGITS_REGEX.test(licenseNumber)) {
    errors.driverLicenseNumber = 'El número de licencia solo debe contener dígitos (0-9)';
  } else if (licenseNumber.length < 6 || licenseNumber.length > 12) {
    errors.driverLicenseNumber = 'El número de licencia debe tener entre 6 y 12 dígitos';
  }

  // 2. Driver license photo
  if (!asTrimmedString(data.driverLicensePhotoUri)) {
    errors.driverLicensePhotoUri = 'La foto de la licencia de conducción es obligatoria';
  }

  // 3. Driver license expiry date (must be after today)
  const licenseExpiry = asTrimmedString(data.driverLicenseExpiryDate);
  if (!licenseExpiry) {
    errors.driverLicenseExpiryDate = 'La fecha de vencimiento de la licencia es obligatoria';
  } else if (!parseLocalDate(licenseExpiry)) {
    errors.driverLicenseExpiryDate = 'Selecciona una fecha de vencimiento válida';
  } else if (!isDateAfterToday(licenseExpiry)) {
    errors.driverLicenseExpiryDate = 'La licencia debe tener fecha de vencimiento posterior a hoy';
  }

  // 4. SOAT photo
  if (!asTrimmedString(data.soatPhotoUri)) {
    errors.soatPhotoUri = 'La foto del SOAT vigente es obligatoria';
  }

  // 5. SOAT expiry date (must be after today)
  const soatExpiry = asTrimmedString(data.soatExpiryDate);
  if (!soatExpiry) {
    errors.soatExpiryDate = 'La fecha de vencimiento del SOAT es obligatoria';
  } else if (!parseLocalDate(soatExpiry)) {
    errors.soatExpiryDate = 'Selecciona una fecha de vencimiento válida';
  } else if (!isDateAfterToday(soatExpiry)) {
    errors.soatExpiryDate = 'El SOAT debe tener fecha de vencimiento posterior a hoy';
  }

  // 6. Mechanical inspection (if applicable based on vehicle year)
  const mechPhoto = asTrimmedString(data.mechanicalInspectionPhotoUri);
  const mechExpiry = asTrimmedString(data.mechanicalInspectionExpiryDate);

  if (requiresMechanicalInspection) {
    if (!mechPhoto) {
      errors.mechanicalInspectionPhotoUri =
        'La foto de la revisión técnico-mecánica es obligatoria según el año del vehículo';
    }
    if (!mechExpiry) {
      errors.mechanicalInspectionExpiryDate =
        'La fecha de vencimiento de la técnico-mecánica es obligatoria';
    } else if (!parseLocalDate(mechExpiry)) {
      errors.mechanicalInspectionExpiryDate = 'Selecciona una fecha de vencimiento válida';
    } else if (!isDateAfterToday(mechExpiry)) {
      errors.mechanicalInspectionExpiryDate =
        'La revisión técnico-mecánica debe tener fecha de vencimiento posterior a hoy';
    }
  } else if (mechExpiry) {
    // Even if optional for newer vehicles, if the user enters a date it must be valid & future
    if (!parseLocalDate(mechExpiry) || !isDateAfterToday(mechExpiry)) {
      errors.mechanicalInspectionExpiryDate =
        'La fecha de vencimiento debe ser posterior a hoy';
    }
  }

  // 7. Mercado Pago account email
  const mercadoPagoEmail = asTrimmedString(data.mercadoPagoEmail);
  if (!mercadoPagoEmail) {
    errors.mercadoPagoEmail = 'El correo de tu cuenta de Mercado Pago es obligatorio';
  } else if (!EMAIL_REGEX.test(mercadoPagoEmail)) {
    errors.mercadoPagoEmail =
      'Ingresa un correo válido de Mercado Pago (ej. pagos@dominio.com)';
  }

  // 8. Terms & commission acceptance
  if (data.termsAccepted !== true) {
    errors.termsAccepted = `Debes aceptar los términos y la comisión de la plataforma (${PLATFORM_COMMISSION_PERCENT} %)`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    requiresMechanicalInspection,
    errors,
  };
}

