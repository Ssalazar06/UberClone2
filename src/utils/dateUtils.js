// AI-assisted: see docs/AI_LOG.md #2

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (number) => String(number).padStart(2, '0');

/**
 * Parses a `YYYY-MM-DD` string as a LOCAL date.
 * Note: `new Date('2008-11-05')` is parsed as UTC, which in Colombia (UTC-5)
 * becomes the previous day. This helper avoids that off-by-one error.
 * @param {string} value
 * @returns {Date | null}
 */
export function parseLocalDate(value) {
  const match = ISO_DATE_REGEX.exec(value || '');
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  // Rejects impossible dates such as 2023-02-30
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** @param {Date} date @returns {string} `YYYY-MM-DD` */
export function toIsoDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** @param {string} value `YYYY-MM-DD` @returns {string} `DD/MM/AAAA` or '' */
export function formatDisplayDate(value) {
  const date = parseLocalDate(value);
  if (!date) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** @param {Date} date @param {number} years @returns {Date} */
export function subtractYears(date, years) {
  return new Date(date.getFullYear() - years, date.getMonth(), date.getDate());
}

/** @param {Date} date @param {number} years @returns {Date} */
export function addYears(date, years) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

/** @param {Date} [today] @returns {Date} Tomorrow at 00:00:00 local time */
export function getTomorrowDate(today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
}

/**
 * Checks whether a `YYYY-MM-DD` date is strictly after today.
 * Used for document expiration dates (driver license, SOAT, mechanical inspection).
 * @param {string} dateString
 * @param {Date} [today]
 * @returns {boolean}
 */
export function isDateAfterToday(dateString, today = new Date()) {
  const date = parseLocalDate(dateString);
  if (!date) return false;

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date.getTime() > todayMidnight.getTime();
}

/**
 * Age in full years at `today`.
 * @param {string} birthDate `YYYY-MM-DD`
 * @param {Date} [today]
 * @returns {number | null}
 */
export function calculateAge(birthDate, today = new Date()) {
  const date = parseLocalDate(birthDate);
  if (!date) return null;

  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}
