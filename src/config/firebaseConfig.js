import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = typeof process !== 'undefined' && process.env ? process.env : {};

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCkjz2mr3yUXYMK1HVBOA0yynvLPFZdCRE',
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'consumoapi-f84db.firebaseapp.com',
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'consumoapi-f84db',
  storageBucket:
    env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'consumoapi-f84db.firebasestorage.app',
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '187382199288',
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:187382199288:web:9db9250ebc19017cd95c0d',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
