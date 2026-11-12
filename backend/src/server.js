import express from 'express';
import cors from 'cors';
import { ENV, hasMercadoPagoToken } from './config/env.js';
import paymentsRoutes from './routes/paymentsRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests to make debugging webhooks and mobile calls easy
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'uberclone-payments-backend',
    mercadoPagoConfigured: hasMercadoPagoToken(),
    publicUrl: ENV.BACKEND_PUBLIC_URL,
  });
});

app.use('/payments', paymentsRoutes);
// Alias so webhooks configured at /webhook (without /payments) also work seamlessly
app.use('/', paymentsRoutes);

app.listen(ENV.PORT, () => {
  console.log(`Backend de pagos escuchando en http://localhost:${ENV.PORT}`);
  console.log(
    hasMercadoPagoToken()
      ? 'Mercado Pago: MP_ACCESS_TOKEN configurado (Checkout Pro real).'
      : 'Mercado Pago: sin MP_ACCESS_TOKEN en backend/.env (usando Checkout Pro mock local).'
  );
});

