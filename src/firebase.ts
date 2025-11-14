import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getFirestore, Firestore } from 'firebase/firestore';

// Active configuration - uses environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase configuration values
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

// Check for missing or undefined values (including checking for 'undefined' string)
const missingKeys = requiredConfigKeys.filter((key) => {
  const value = firebaseConfig[key];
  return (
    !value ||
    value === '' ||
    value === 'undefined' ||
    String(value).trim() === ''
  );
});

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let db: Firestore | null = null;

if (missingKeys.length > 0) {
  const envVarMap: Record<string, string> = {
    apiKey: 'VITE_FIREBASE_API_KEY',
    authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
    projectId: 'VITE_FIREBASE_PROJECT_ID',
    storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'VITE_FIREBASE_APP_ID',
  };

  const missingEnvVars = missingKeys.map((key) => envVarMap[key]).join(', ');
  const errorMessage = `Missing required Firebase configuration values: ${missingKeys.join(', ')}. Please set the following environment variables: ${missingEnvVars}`;

  if (typeof window !== 'undefined') {
    console.error('Firebase Configuration Error:', errorMessage);
    console.error(
      'To fix this, create a .env file in the project root with your Firebase configuration.'
    );
    console.error('Example .env file:');
    console.error(`
      VITE_FIREBASE_API_KEY=your-api-key
      VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
      VITE_FIREBASE_PROJECT_ID=your-project-id
      VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
      VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
      VITE_FIREBASE_APP_ID=your-app-id
      VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
    `);
  }

  // Don't throw - instead export null values so the app can still run
  // Components using Firebase should check for null before using
  console.warn(
    'Firebase will not be initialized due to missing configuration.'
  );
} else {
  try {
    app = initializeApp(firebaseConfig);

    // Only initialize analytics in browser environment and if app is valid
    if (typeof window !== 'undefined' && app) {
      try {
        analytics = getAnalytics(app);
      } catch (analyticsError) {
        console.warn(
          'Failed to initialize Firebase Analytics:',
          analyticsError
        );
        analytics = null;
      }
    }

    if (app) {
      db = getFirestore(app);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    app = null;
    analytics = null;
    db = null;
  }
}

export { app, analytics, db };
