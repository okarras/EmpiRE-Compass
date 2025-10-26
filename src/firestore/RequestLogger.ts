/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

/**
 * Firebase Request Logger
 * Logs all Firestore operations for admin monitoring
 */

export interface FirebaseRequest {
  id?: string;
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
 * Log a Firebase request
 */
export const logRequest = async (
  operation: 'read' | 'write' | 'update' | 'delete' | 'query',
  collectionPath: string,
  documentId: string | undefined,
  success: boolean,
  userId?: string,
  userEmail?: string,
  error?: string,
  metadata?: any,
  requestBody?: any,
  responseData?: any
): Promise<void> => {
  try {
    const logEntry: Omit<FirebaseRequest, 'id'> = {
      timestamp: Timestamp.now(),
      operation,
      collection: collectionPath,
      documentId,
      success,
      userId,
      userEmail,
      error,
      metadata,
      requestBody,
      responseData,
    };

    // Remove undefined fields
    Object.keys(logEntry).forEach((key) => {
      if (logEntry[key as keyof typeof logEntry] === undefined) {
        delete logEntry[key as keyof typeof logEntry];
      }
    });

    await addDoc(collection(db, 'FirebaseRequestLogs'), logEntry);
  } catch (err) {
    // Don't let logging errors break the app
    console.error('Failed to log Firebase request:', err);
  }
};

/**
 * Subscribe to real-time request logs
 */
export const subscribeToRequestLogs = (
  callback: (logs: FirebaseRequest[]) => void,
  maxLogs: number = 100
): Unsubscribe => {
  const logsQuery = query(
    collection(db, 'FirebaseRequestLogs'),
    orderBy('timestamp', 'desc'),
    limit(maxLogs)
  );

  console.log('logsQuery', logsQuery);
  return onSnapshot(logsQuery, (snapshot) => {
    console.log(
      'snapshot',
      snapshot.docs.map((doc) => doc.data())
    );
    const logs: FirebaseRequest[] = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as FirebaseRequest);
    });
    callback(logs);
  });
};

/**
 * Wrapper for logging Firestore operations
 */
export const withLogging = {
  /**
   * Log a read operation
   */
  logRead: async (
    collectionPath: string,
    documentId: string,
    success: boolean,
    userId?: string,
    userEmail?: string,
    error?: string,
    responseData?: any
  ) => {
    await logRequest(
      'read',
      collectionPath,
      documentId,
      success,
      userId,
      userEmail,
      error,
      { method: 'getDoc' },
      undefined,
      responseData
    );
  },

  /**
   * Log a write operation
   */
  logWrite: async (
    collectionPath: string,
    documentId: string,
    success: boolean,
    userId?: string,
    userEmail?: string,
    error?: string,
    requestBody?: any
  ) => {
    await logRequest(
      'write',
      collectionPath,
      documentId,
      success,
      userId,
      userEmail,
      error,
      { method: 'setDoc', dataSize: JSON.stringify(requestBody || {}).length },
      requestBody,
      undefined
    );
  },

  /**
   * Log an update operation
   */
  logUpdate: async (
    collectionPath: string,
    documentId: string,
    success: boolean,
    userId?: string,
    userEmail?: string,
    error?: string,
    requestBody?: any
  ) => {
    await logRequest(
      'update',
      collectionPath,
      documentId,
      success,
      userId,
      userEmail,
      error,
      {
        method: 'updateDoc',
        dataSize: JSON.stringify(requestBody || {}).length,
      },
      requestBody,
      undefined
    );
  },

  /**
   * Log a delete operation
   */
  logDelete: async (
    collectionPath: string,
    documentId: string,
    success: boolean,
    userId?: string,
    userEmail?: string,
    error?: string
  ) => {
    await logRequest(
      'delete',
      collectionPath,
      documentId,
      success,
      userId,
      userEmail,
      error,
      { method: 'deleteDoc' },
      undefined,
      undefined
    );
  },

  /**
   * Log a query operation
   */
  logQuery: async (
    collectionPath: string,
    success: boolean,
    userId?: string,
    userEmail?: string,
    error?: string,
    queryType?: string,
    resultCount?: number
  ) => {
    await logRequest(
      'query',
      collectionPath,
      undefined,
      success,
      userId,
      userEmail,
      error,
      { method: 'getDocs', queryType, resultCount },
      undefined,
      undefined
    );
  },
};

const RequestLogger = {
  logRequest,
  subscribeToRequestLogs,
  withLogging,
};

export default RequestLogger;
