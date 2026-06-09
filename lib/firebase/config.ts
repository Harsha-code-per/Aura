import { getApps, initializeApp, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForTestingPurposesOnly123",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "aura-dummy.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "aura-dummy",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "aura-dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:dummy",
};

// Initialize Firebase App
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
