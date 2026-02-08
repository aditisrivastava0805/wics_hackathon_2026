// frontend/lib/firebase/config.ts

import { getApps, getApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⚠️ HARDCODED CONFIG FOR HACKATHON (Bypassing .env issues)
const firebaseConfig = {
  apiKey: "AIzaSyD77eoMXIxpZJigfKJ_-s9ied_AQJTEGY0",
  authDomain: "wicshackathon2026.firebaseapp.com",
  projectId: "wicshackathon2026",
  storageBucket: "wicshackathon2026.firebasestorage.app",
  messagingSenderId: "799485842611",
  appId: "1:799485842611:web:c387af607b758173998cc6",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;