
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.error(
    "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or not loaded. " +
    "Ensure it is correctly set in your .env.local file in the project root, " +
    "and that you have restarted your Next.js development server after changes to this file."
  );
}
// Ensure all required config values are present before initializing
const requiredConfigs = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

// Check if all firebaseConfig values are defined
const allConfigsPresent = Object.values(requiredConfigs).every(value => !!value);

if (allConfigsPresent) {
  if (!getApps().length) {
    app = initializeApp(requiredConfigs);
  } else {
    app = getApp();
  }
} else {
  console.error("Firebase configuration is incomplete. Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_... variables are set and the server was restarted.");
  // Fallback or throw error if Firebase cannot be initialized
  // For now, we'll let subsequent getAuth/getFirestore calls fail if app is not initialized.
  // A more robust solution might involve a dummy app or explicit error handling here.
  // However, Firebase itself will throw errors if 'app' is not correctly initialized.
  // @ts-ignore
  app = undefined; // Explicitly set to undefined if config is missing
}


// Initialize Firebase services, conditionally if app was initialized
const auth: Auth = app ? getAuth(app) : (()=>{
  console.error("Firebase Auth could not be initialized due to missing Firebase app instance (configuration error).");
  return {} as Auth; // Return a dummy object or throw
})();

const db: Firestore = app ? getFirestore(app) : (()=>{
  console.error("Firestore could not be initialized due to missing Firebase app instance (configuration error).");
  return {} as Firestore; // Return a dummy object or throw
})();

export { app, auth, db };
