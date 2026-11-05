// AI-assisted: see docs/AI_LOG.md #2
import { GENDER_OPTIONS, MIN_DRIVER_AGE } from '../../data/registrationOptions.js';
import { calculateAge, parseLocalDate } from '../dateUtils.js';

// Letters (including Spanish accents, ñ and ü) separated by single spaces.
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
const ONLY_DIGITS_REGEX = /^\d+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const asTrimmedString = (value) => (value ?? '').toString().trim();

/**
 * Pure validation for Tab 1 (personal info). Messages are in Spanish (UI).
 *
 * - profilePhotoUri: required.
 * - fullName: required, max 50 chars, letters (with accents) and spaces only.
 * - documentId: required, digits 0-9 only, 6 to 10 digits.
 * - phoneNumber: required, digits 0-9 only, exactly 10 digits.
 * - birthDate: required, valid date, not in the future, 18 years or older.
 * - gender: required, one of GENDER_OPTIONS.
 * - email: required, contains @ and a domain.
 *
 * @param {Partial<typeof import('../../data/registrationData').initialPersonalInfo>} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validatePersonalInfo(data = {}) {
  const errors = {};

  // 1. Profile photo
  if (!asTrimmedString(data.profilePhotoUri)) {
    errors.profilePhotoUri = 'La foto de perfil es obligatoria';
  }

  // 2. Full name
  const fullName = asTrimmedString(data.fullName).replace(/\s+/g, ' ');
  if (!fullName) {
    errors.fullName = 'El nombre completo es obligatorio';
  } else if (fullName.length > 50) {
    errors.fullName = 'El nombre no puede superar los 50 caracteres';
  } else if (!NAME_REGEX.test(fullName)) {
    errors.fullName = 'El nombre solo puede contener letras y espacios (sin números ni caracteres especiales)';
  }

  // 3. Document ID
  const documentId = asTrimmedString(data.documentId);
  if (!documentId) {
    errors.documentId = 'El documento de identidad es obligatorio';
  } else if (!ONLY_DIGITS_REGEX.test(documentId)) {
    errors.documentId = 'El documento solo debe contener números (0-9)';
  } else if (documentId.length < 6 || documentId.length > 10) {
    errors.documentId = 'El documento debe tener entre 6 y 10 dígitos';
  }

  // 4. Phone number
  const phoneNumber = asTrimmedString(data.phoneNumber);
  if (!phoneNumber) {
    errors.phoneNumber = 'El número de celular es obligatorio';
  } else if (!ONLY_DIGITS_REGEX.test(phoneNumber)) {
    errors.phoneNumber = 'El celular solo debe contener números (0-9)';
  } else if (phoneNumber.length !== 10) {
    errors.phoneNumber = 'El celular debe tener exactamente 10 dígitos';
  }

  // 5. Birth date (18+)
  const birthDate = asTrimmedString(data.birthDate);
  if (!birthDate) {
    errors.birthDate = 'La fecha de nacimiento es obligatoria';
  } else if (!parseLocalDate(birthDate)) {
    errors.birthDate = 'Selecciona una fecha de nacimiento válida';
  } else {
    const age = calculateAge(birthDate);
    if (age < 0) {
      errors.birthDate = 'La fecha de nacimiento no puede ser futura';
    } else if (age < MIN_DRIVER_AGE) {
      errors.birthDate = `Debes ser mayor de ${MIN_DRIVER_AGE} años para registrarte`;
    } else if (age > 100) {
      errors.birthDate = 'Selecciona una fecha de nacimiento válida';
    }
  }

  // 6. Gender (dropdown)
  const validGenders = GENDER_OPTIONS.map((option) => option.value);
  if (!data.gender) {
    errors.gender = 'Selecciona tu género';
  } else if (!validGenders.includes(data.gender)) {
    errors.gender = 'El género seleccionado no es válido';
  }

  // 7. Email
  const email = asTrimmedString(data.email);
  if (!email) {
    errors.email = 'El correo electrónico es obligatorio';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Ingresa un correo válido (ej. nombre@dominio.com)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
