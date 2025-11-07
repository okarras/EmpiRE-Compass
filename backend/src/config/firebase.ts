import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccount) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required'
    );
  }

  let serviceAccountJson;
  try {
    serviceAccountJson =
      typeof serviceAccount === 'string'
        ? JSON.parse(serviceAccount)
        : serviceAccount;
  } catch {
    throw new Error(
      'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Must be valid JSON.'
    );
  }

  initializeApp({
    credential: cert(serviceAccountJson),
  });
}

export const db = getFirestore();
