// AI-assisted: see docs/AI_LOG.md #5

import { PAYMENT_API_URL } from '../config/appConfig.js';

/**
 * Calls the payments backend (`POST /payments/preference`) to generate a
 * Mercado Pago Checkout Pro link for the completed trip.
 *
 * @param {{ tripId: string, amount: number, description?: string, payerEmail?: string }} params
 * @returns {Promise<{
 *   ok: boolean,
 *   preferenceId: string,
 *   initPoint: string,
 *   sandboxInitPoint: string,
 *   checkoutUrl: string,
 *   mode: string,
 * }>}
 */
export const createPaymentPreference = async ({ tripId, amount, description, payerEmail }) => {
  const response = await fetch(`${PAYMENT_API_URL}/payments/preference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ tripId, amount, description, payerEmail }),
  });

  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `El servidor (${PAYMENT_API_URL}) respondió con formato inesperado. Verifica que el backend esté encendido.`
    );
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'No se pudo generar la preferencia de pago en el servidor.');
  }

  return data;
};

/**
 * Sends a simulated webhook notification to the payments backend (`POST /payments/webhook`)
 * for local sandbox verification when testing without an external ngrok tunnel.
 *
 * @param {{ tripId: string, paymentStatus: 'approved' | 'pending' | 'rejected', paymentId?: string }} params
 */
export const notifyPaymentWebhook = async ({ tripId, paymentStatus, paymentId }) => {
  const response = await fetch(`${PAYMENT_API_URL}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ tripId, paymentStatus, paymentId }),
  });

  const data = await response.json();
  return data;
};

/**
 * Asks the payments backend (`GET /payments/status/:tripId`) to query Mercado Pago
 * directly and sync the latest payment status of the trip into Firestore.
 *
 * @param {string} tripId
 * @returns {Promise<{ ok: boolean, found: boolean, paymentStatus: string, rawStatus?: string, statusDetail?: string, paymentId?: string, tripStatus?: string }>}
 */
export const checkTripPaymentStatus = async (tripId) => {
  const response = await fetch(
    `${PAYMENT_API_URL}/payments/status/${encodeURIComponent(tripId)}`,
    {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    }
  );

  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `El servidor (${PAYMENT_API_URL}) respondió con formato inesperado. Verifica que el backend esté encendido.`
    );
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'No se pudo verificar el estado del pago.');
  }

  return data;
};

