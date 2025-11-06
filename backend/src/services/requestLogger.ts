import { db } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

export interface FirebaseRequest {
  timestamp: Timestamp;
  operation: 'read' | 'write' | 'update' | 'delete' | 'query';
  collection: string;
  documentId?: string;
  userId?: string;
  userEmail?: string;
  success: boolean;
  error?: string;
  metadata?: {
    method?: string;
    path?: string;
    dataSize?: number;
    queryType?: string;
    resultCount?: number;
  };
  requestBody?: any;
  responseData?: any;
}

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
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

/**
 * Log a Firebase request
 */
export const logRequest = async (
  operation: FirebaseRequest['operation'],
  collection: string,
  documentId: string | undefined,
  success: boolean,
  userId?: string,
  userEmail?: string,
  error?: string,
  metadata?: FirebaseRequest['metadata'],
  requestBody?: any,
  responseData?: any
): Promise<void> => {
  try {
    const logEntry: FirebaseRequest = {
      timestamp: Timestamp.now(),
      operation,
      collection,
      documentId,
      userId,
      userEmail,
      success,
      error,
      metadata,
      requestBody,
      responseData,
    };

    // Remove undefined values before saving to Firestore
    const cleanedEntry = removeUndefined(logEntry as Record<string, any>);

    await db.collection('FirebaseRequestLogs').add(cleanedEntry);
  } catch (logError) {
    // Don't throw - logging failures shouldn't break the app
    console.error('Failed to log request:', logError);
  }
};
