import 'dotenv/config';

export const ENV = {
  PORT: Number(process.env.PORT) || 3001,
  MP_ACCESS_TOKEN: (process.env.MP_ACCESS_TOKEN || '').trim(),
  BACKEND_PUBLIC_URL: (process.env.BACKEND_PUBLIC_URL || `http://localhost:${Number(process.env.PORT) || 3001}`).replace(/\/$/, ''),
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || '',
};

export const hasMercadoPagoToken = () =>
  Boolean(ENV.MP_ACCESS_TOKEN) && !ENV.MP_ACCESS_TOKEN.includes('tu-access-token');

