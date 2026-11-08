import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

export const isFirebaseConfigured = (): boolean =>
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

let firestore: Firestore | null = null;

// Initialize Firebase Admin SDK on first use rather than at import time, so the
// server (and modules that only import `db`, e.g. in tests) can load without a
// service account. Only code paths that actually touch Firestore fail.
const getDb = (): Firestore => {
  if (firestore) return firestore;

  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required for this route (see backend/README.md)'
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

  firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
};

const db = new Proxy({} as Firestore, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export { db };
