import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { ENV } from './env.js';

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY || 'AIzaSyCkjz2mr3yUXYMK1HVBOA0yynvLPFZdCRE',
  authDomain: ENV.FIREBASE_AUTH_DOMAIN || 'consumoapi-f84db.firebaseapp.com',
  projectId: ENV.FIREBASE_PROJECT_ID || 'consumoapi-f84db',
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET || 'consumoapi-f84db.firebasestorage.app',
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID || '187382199288',
  appId: ENV.FIREBASE_APP_ID || '1:187382199288:web:9db9250ebc19017cd95c0d',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

