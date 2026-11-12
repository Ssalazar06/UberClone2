import { Router } from 'express';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import {
  createCheckoutPreference,
  getMercadoPagoPayment,
  mapMercadoPagoStatus,
  searchMercadoPagoPaymentsByReference,
} from '../services/mercadoPagoService.js';

const router = Router();

/**
 * GET /payments/status/:tripId
 * Actively asks Mercado Pago for the latest payment linked to `tripId`
 * (external_reference) and syncs it into Firestore. Fallback when the webhook
 * is delayed, ngrok is down, or the user closed Checkout Pro without returning.
 */
router.get('/status/:tripId', async (req, res) => {
  const { tripId } = req.params;
  try {
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) {
      return res.status(404).json({ ok: false, error: `Viaje "${tripId}" no encontrado.` });
    }

    const tripData = tripSnap.data();
    const mpPayment = await searchMercadoPagoPaymentsByReference(tripId);

    if (!mpPayment) {
      console.log(`[MP Status] Sin pagos registrados en Mercado Pago para el viaje ${tripId}`);
      return res.json({
        ok: true,
        tripId,
        found: false,
        paymentStatus: tripData.paymentStatus || 'pending',
        tripStatus: tripData.status,
      });
    }

    const paymentStatus = mapMercadoPagoStatus(mpPayment.status);
    const paymentId = String(mpPayment.id);
    const updatePayload = {
      paymentStatus,
      paymentId,
      updatedAt: serverTimestamp(),
    };
    if (paymentStatus === 'approved') {
      updatePayload.status = 'paid';
      updatePayload.paidAt = serverTimestamp();
    }
    await updateDoc(tripRef, updatePayload);

    console.log(
      `[MP Status] Viaje ${tripId} -> MP status=${mpPayment.status} (pago ${paymentId})`
    );

    return res.json({
      ok: true,
      tripId,
      found: true,
      paymentStatus,
      rawStatus: mpPayment.status,
      statusDetail: mpPayment.status_detail,
      paymentId,
      tripStatus: paymentStatus === 'approved' ? 'paid' : tripData.status,
    });
  } catch (error) {
    console.error('Error in GET /payments/status:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error consultando el estado del pago.',
    });
  }
});

/**
 * POST /payments/preference
 * Body: { tripId, amount, description?, payerEmail? }
 * Creates a Checkout Pro preference and returns the checkout URL.
 */
router.post('/preference', async (req, res) => {
  try {
    const { tripId, amount, description, payerEmail } = req.body || {};
    const numericAmount = Math.round(Number(amount));

    if (!tripId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'Se requiere tripId y un monto válido mayor a 0.',
      });
    }

    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) {
      return res.status(404).json({
        ok: false,
        error: `No se encontró el viaje "${tripId}" en Firestore.`,
      });
    }

    const requestOrigin = req.get('host') ? `${req.protocol}://${req.get('host')}` : undefined;
    const preference = await createCheckoutPreference({
      tripId,
      amount: numericAmount,
      description,
      payerEmail,
      requestOrigin,
    });

    await updateDoc(tripRef, {
      paymentPreferenceId: preference.preferenceId,
      paymentStatus: 'pending',
      updatedAt: serverTimestamp(),
    });

    return res.json({
      ok: true,
      tripId,
      amount: numericAmount,
      ...preference,
    });
  } catch (error) {
    console.error('Error in POST /payments/preference:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error interno creando la preferencia de pago.',
    });
  }
});

/**
 * POST /payments/webhook
 * Receives either Mercado Pago webhook notifications ({ type: 'payment', data: { id } })
 * or direct sandbox notifications ({ tripId, paymentStatus, paymentId }).
 * Updates paymentStatus, paymentId, and status: 'paid' (when approved) in Firestore.
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const query = req.query || {};

    console.log('[MP Webhook] body:', JSON.stringify(body), 'query:', JSON.stringify(query));

    let tripId = body.tripId || body.external_reference || query.tripId || null;
    let paymentId = body.paymentId || body?.data?.id || query['data.id'] || query.id || null;
    let paymentStatus = body.paymentStatus || body.status || null;

    const topic = body.type || body.topic || query.topic || query.type;

    // merchant_order / order events: resolve tripId via external_reference and sync by search
    if (
      topic &&
      topic !== 'payment' &&
      !tripId &&
      !paymentStatus &&
      ['merchant_order', 'topic_merchant_order_wh', 'order'].includes(topic)
    ) {
      const resourceRef = body?.data?.external_reference || body?.external_reference || null;
      if (!resourceRef) {
        return res.status(200).json({ ok: true, ignoredTopic: topic });
      }
      const mpPayment = await searchMercadoPagoPaymentsByReference(resourceRef).catch(() => null);
      if (!mpPayment) {
        return res.status(200).json({ ok: true, note: `Evento ${topic} sin pago asociado aún.` });
      }
      tripId = resourceRef;
      paymentStatus = mpPayment.status;
      paymentId = String(mpPayment.id);
    }

    // Ignore other non-payment events (e.g., fraud_alerts) with 200 OK
    if (topic && topic !== 'payment' && !tripId && !paymentStatus) {
      return res.status(200).json({ ok: true, ignoredTopic: topic });
    }

    // Official Mercado Pago webhook: fetch payment details from MP API
    if ((topic === 'payment' || !tripId) && paymentId && !paymentStatus) {
      try {
        const mpPayment = await getMercadoPagoPayment(paymentId);
        if (mpPayment) {
          tripId = mpPayment.external_reference || mpPayment.metadata?.trip_id || tripId;
          paymentStatus = mapMercadoPagoStatus(mpPayment.status);
          paymentId = String(mpPayment.id || paymentId);
        }
      } catch (mpErr) {
        console.warn('[MP Webhook] No se pudo consultar pago en MP (posible prueba del panel):', mpErr.message);
        return res.status(200).json({ ok: true, note: 'Evento recibido (ID no encontrado en MP API)' });
      }
    }

    if (!tripId) {
      return res.status(200).json({
        ok: true,
        note: 'Webhook recibido sin tripId/external_reference asociado.',
      });
    }

    const finalPaymentStatus = mapMercadoPagoStatus(paymentStatus || 'pending');
    const finalPaymentId = String(paymentId || `mp_pay_${Date.now()}`);

    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);
    if (!tripSnap.exists()) {
      return res.status(404).json({
        ok: false,
        error: `Viaje "${tripId}" no encontrado.`,
      });
    }

    const updatePayload = {
      paymentStatus: finalPaymentStatus,
      paymentId: finalPaymentId,
      updatedAt: serverTimestamp(),
    };

    if (finalPaymentStatus === 'approved') {
      updatePayload.status = 'paid';
      updatePayload.paidAt = serverTimestamp();
    }

    await updateDoc(tripRef, updatePayload);

    return res.json({
      ok: true,
      tripId,
      paymentStatus: finalPaymentStatus,
      paymentId: finalPaymentId,
      tripStatus: finalPaymentStatus === 'approved' ? 'paid' : tripSnap.data().status,
    });
  } catch (error) {
    console.error('Error in POST /payments/webhook:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error procesando webhook de pago.',
    });
  }
});

/**
 * GET /payments/mock-checkout
 * Interactive Checkout Pro simulator page when MP_ACCESS_TOKEN is not yet configured.
 */
router.get('/mock-checkout', (req, res) => {
  const tripId = String(req.query.tripId || '');
  const amount = Number(req.query.amount || 0);
  const formatted = `$${Math.round(amount).toLocaleString('es-CO')} COP`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Checkout Pro Sandbox — UberClone</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f4f8f5; margin: 0; padding: 24px; display: flex; justify-content: center; }
    .card { background: #fff; border-radius: 16px; max-width: 420px; width: 100%; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .badge { display: inline-block; background: #e7f5ec; color: #1b7f3b; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 99px; }
    h1 { font-size: 20px; margin: 12px 0 4px; color: #13201a; }
    p { color: #55665c; font-size: 14px; line-height: 1.5; }
    .amount { font-size: 28px; font-weight: 800; color: #1b7f3b; margin: 16px 0; }
    button { width: 100%; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 10px; }
    .approve { background: #009ee3; color: #fff; }
    .pending { background: #fff4e0; color: #b26a00; }
    .reject { background: #fdecec; color: #d32f2f; }
    #result { margin-top: 16px; font-weight: 600; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Checkout Pro (Modo Prueba Local)</span>
    <h1>Pago del viaje</h1>
    <p>ID de viaje: <strong>${tripId}</strong></p>
    <div class="amount">${formatted}</div>
    <p>Selecciona un resultado para disparar el webhook hacia Firestore:</p>
    <button class="approve" onclick="sendWebhook('approved')">Aprobar pago</button>
    <button class="pending" onclick="sendWebhook('pending')">Dejar pendiente</button>
    <button class="reject" onclick="sendWebhook('rejected')">Rechazar pago</button>
    <div id="result"></div>
  </div>
  <script>
    async function sendWebhook(status) {
      const resultEl = document.getElementById('result');
      resultEl.textContent = 'Enviando webhook...';
      try {
        const res = await fetch('/payments/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId: '${tripId}', paymentStatus: status, paymentId: 'mp_sandbox_' + Date.now() })
        });
        const data = await res.json();
        resultEl.textContent = data.ok
          ? 'Webhook enviado (' + data.paymentStatus + '). Ya puedes volver a la app del conductor.'
          : 'Error: ' + (data.error || 'Fallo en webhook');
      } catch (e) {
        resultEl.textContent = 'Error de red enviando webhook.';
      }
    }
  </script>
</body>
</html>`);
});

/**
 * GET /payments/return
 * Landing page after Mercado Pago Checkout Pro redirects back.
 * Also syncs payment status into Firestore using Mercado Pago query parameters
 * (`collection_status`, `status`, `payment_id`, `external_reference`, `tripId`).
 */
router.get('/return', async (req, res) => {
  const rawStatus = String(
    req.query.collection_status || req.query.status || 'pending'
  );
  const tripId = String(
    req.query.tripId || req.query.external_reference || ''
  );
  const paymentId = String(
    req.query.payment_id || req.query.collection_id || ''
  );

  const mappedStatus = mapMercadoPagoStatus(rawStatus);

  if (tripId) {
    try {
      const tripRef = doc(db, 'trips', tripId);
      const snap = await getDoc(tripRef);
      if (snap.exists()) {
        const updatePayload = {
          paymentStatus: mappedStatus,
          ...(paymentId && paymentId !== 'null' ? { paymentId } : {}),
          updatedAt: serverTimestamp(),
        };
        if (mappedStatus === 'approved') {
          updatePayload.status = 'paid';
          updatePayload.paidAt = serverTimestamp();
        }
        await updateDoc(tripRef, updatePayload);
        console.log(`[MP Return] Viaje ${tripId} actualizado a paymentStatus=${mappedStatus}`);
      }
    } catch (err) {
      console.error('[MP Return] Error actualizando Firestore:', err);
    }
  }

  const label =
    mappedStatus === 'approved'
      ? 'Pago aprobado'
      : mappedStatus === 'rejected'
      ? 'Pago rechazado'
      : 'Pago pendiente';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${label} — UberClone</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f4f8f5; margin: 0; padding: 24px; display: flex; justify-content: center; }
    .card { background: #fff; border-radius: 16px; max-width: 400px; width: 100%; padding: 24px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    h2 { color: ${mappedStatus === 'approved' ? '#1b7f3b' : mappedStatus === 'rejected' ? '#d32f2f' : '#b26a00'}; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${label}</h2>
    <p>Viaje: <strong>${tripId || 'N/A'}</strong></p>
    ${paymentId && paymentId !== 'null' ? `<p>ID de pago: ${paymentId}</p>` : ''}
    <p>Ya puedes volver a la aplicación del conductor.</p>
  </div>
</body>
</html>`);
});

export default router;

