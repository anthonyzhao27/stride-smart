import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

// Check if we're in a build environment
const isBuildTime = typeof window === 'undefined' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Only initialize Firebase if we're not in build time and environment variables are available
const initializeFirebase = () => {
    if (isBuildTime) {
        // Return mock objects during build time
        return {
            app: null,
            auth: null,
            db: null,
            googleProvider: null
        };
    }

    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    // Initialize Firebase only if it hasn't been initialized already
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const auth = getAuth(app);
    const db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();

    return { app, auth, db, googleProvider };
};

const firebase = initializeFirebase();

// Export with proper typing
export const auth: Auth | null = firebase.auth;
export const db: Firestore | null = firebase.db;
export const googleProvider: GoogleAuthProvider | null = firebase.googleProvider;

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => {
    return !isBuildTime && db !== null && auth !== null;
};