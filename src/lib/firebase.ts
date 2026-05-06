import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app used by admin to create users without signing out the admin session (lazy-loaded)
let secondaryApp: FirebaseApp | null = null;
export function getSecondaryAuth() {
  if (!secondaryApp) {
    const existing = getApps().find((a) => a.name === "secondary");
    secondaryApp = existing ?? initializeApp(firebaseConfig, "secondary");
  }
  return getAuth(secondaryApp);
}

export const ADMIN_EMAIL = "marketingreboost@gmail.com";

export default app;
