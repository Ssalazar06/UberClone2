import { ENV, hasMercadoPagoToken } from '../config/env.js';

const MP_API_BASE = 'https://api.mercadopago.com';

/**
 * Creates a Mercado Pago Checkout Pro preference using the server-side MP_ACCESS_TOKEN.
 * When MP_ACCESS_TOKEN is not configured yet, returns a local mock checkout URL
 * so the full webhook & Firestore synchronization flow can still be tested end-to-end.
 */
export const createCheckoutPreference = async ({
  tripId,
  amount,
  description,
  payerEmail,
  requestOrigin,
}) => {
  const unitPrice = Math.round(Number(amount));
  if (!tripId || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new Error('tripId y amount (> 0) son obligatorios para crear la preferencia.');
  }

  const publicBaseUrl =
    ENV.BACKEND_PUBLIC_URL && !ENV.BACKEND_PUBLIC_URL.includes('localhost')
      ? ENV.BACKEND_PUBLIC_URL
      : requestOrigin || ENV.BACKEND_PUBLIC_URL;

  if (!hasMercadoPagoToken()) {
    const mockUrl = `${publicBaseUrl}/payments/mock-checkout?tripId=${encodeURIComponent(tripId)}&amount=${unitPrice}`;
    return {
      preferenceId: `mock_pref_${tripId}`,
      initPoint: mockUrl,
      sandboxInitPoint: mockUrl,
      checkoutUrl: mockUrl,
      mode: 'sandbox_mock',
    };
  }

  const isHttpsPublic = publicBaseUrl.startsWith('https://');
  const preferencePayload = {
    items: [
      {
        id: tripId,
        title: description || `Viaje UberClone #${tripId}`,
        quantity: 1,
        unit_price: unitPrice,
        currency_id: 'COP',
      },
    ],
    external_reference: tripId,
    ...(isHttpsPublic ? { notification_url: `${publicBaseUrl}/payments/webhook` } : {}),
    back_urls: {
      success: `${publicBaseUrl}/payments/return?status=approved&tripId=${encodeURIComponent(tripId)}`,
      pending: `${publicBaseUrl}/payments/return?status=pending&tripId=${encodeURIComponent(tripId)}`,
      failure: `${publicBaseUrl}/payments/return?status=rejected&tripId=${encodeURIComponent(tripId)}`,
    },
    ...(isHttpsPublic ? { auto_return: 'approved' } : {}),
    metadata: {
      trip_id: tripId,
    },
    ...(payerEmail ? { payer: { email: payerEmail } } : {}),
  };

  const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ENV.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preferencePayload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Mercado Pago preference error response:', JSON.stringify(data));
    const detail = data?.message || data?.error || 'Error al crear la preferencia en Mercado Pago.';
    throw new Error(detail);
  }

  console.log(
    `[MP Preference] Creada preferencia ${data.id} para viaje ${tripId} | init_point=${data.init_point}`
  );

  // Mercado Pago unified test and production flows under `init_point`;
  // `sandbox_init_point` is deprecated and may fail with modern APP_USR test tokens.
  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
    checkoutUrl: data.init_point || data.sandbox_init_point,
    mode: 'mercadopago',
  };
};

/**
 * Fetches full payment details from Mercado Pago API for webhook verification.
 */
export const getMercadoPagoPayment = async (paymentId) => {
  if (!hasMercadoPagoToken() || !paymentId) return null;

  const response = await fetch(`${MP_API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${ENV.MP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo consultar el pago ${paymentId} en Mercado Pago.`);
  }

  return await response.json();
};

/**
 * Searches Mercado Pago payments by `external_reference` (`tripId`) so the app can
 * actively verify and sync payment status into Firestore if a webhook is delayed.
 */
export const searchMercadoPagoPaymentsByReference = async (tripId) => {
  if (!hasMercadoPagoToken() || !tripId) return null;

  const url = `${MP_API_BASE}/v1/payments/search?external_reference=${encodeURIComponent(
    tripId
  )}&sort=date_created&criteria=desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ENV.MP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `No se pudo consultar el estado del viaje ${tripId} en Mercado Pago (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  if (results.length === 0) return null;

  const approvedPayment = results.find(
    (item) => String(item?.status || '').toLowerCase() === 'approved'
  );
  return approvedPayment || results[0];
};

/**
 * Maps Mercado Pago payment statuses to internal app paymentStatus values.
 */
export const mapMercadoPagoStatus = (rawStatus) => {
  const normalized = String(rawStatus || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'authorized') return 'approved';
  if (normalized === 'rejected' || normalized === 'cancelled' || normalized === 'refunded') {
    return 'rejected';
  }
  return 'pending';
};

