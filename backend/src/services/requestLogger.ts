import { db, isFirebaseConfigured } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { sanitizeLogRecord } from './logSanitizer.js';

export interface FirebaseRequest {
  timestamp: Timestamp;
  operation: 'read' | 'write' | 'update' | 'delete' | 'query';
  collection: string;
  documentId?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
  requestBody?: any;
  responseData?: any;
}

const removeUndefined = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Timestamp)
      ) {
        cleaned[key] = removeUndefined(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

export const logRequest = async (
  operation: FirebaseRequest['operation'],
  collection: string,
  documentId: string | undefined,
  success: boolean,
  _userId?: string,
  _userEmail?: string,
  error?: string,
  metadata?: FirebaseRequest['metadata'],
  requestBody?: any,
  responseData?: any
): Promise<void> => {
  try {
    const logEntry = sanitizeLogRecord({
      timestamp: Timestamp.now(),
      operation,
      collection,
      documentId,
      success,
      error,
      metadata,
      requestBody,
      responseData,
    }) as unknown as FirebaseRequest;

    // Remove undefined values before saving to Firestore
    const cleanedEntry = removeUndefined(logEntry as Record<string, any>);

    // Local setups without a service account have nowhere to write logs
    if (!isFirebaseConfigured()) return;

    await db.collection('FirebaseRequestLogs').add(cleanedEntry);
  } catch (logError) {
    // Don't throw - logging failures shouldn't break the app
    const message =
      logError instanceof Error ? logError.message : 'Unknown error';
    console.error('Failed to log request:', message);
  }
};
