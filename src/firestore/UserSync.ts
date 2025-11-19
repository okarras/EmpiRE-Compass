import { syncUser as syncUserApi } from '../services/backendApi';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Firebase User Sync Service
 * Now uses backend API for write operations, Firebase for reads
 */

export interface FirebaseUser {
  email: string;
  display_name: string;
  id: string;
  created_at: string;
  is_admin?: boolean;
  is_curation_allowed?: boolean;
  observatory_id?: string | null;
  organization_id?: string | null;
  last_login?: string;
}

/**
 * Note: Admin emails are defined in backend/src/config/constants.ts
 * The frontend relies on the is_admin flag from Firebase, which is
 * synced by the backend based on ADMIN_USER_EMAILS.
 */

/**
 * Get user from Firebase (read operation - still uses direct Firestore)
 */
export const getFirebaseUser = async (
  userId: string
): Promise<FirebaseUser | null> => {
  if (!db) {
    console.warn('Firebase is not initialized. Cannot fetch user.');
    return null;
  }

  try {
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user from Firebase:', error);
    return null;
  }
};

/**
 * Sync ORKG user to Firebase Users collection via backend API
 * This ensures Firebase rules can check user permissions
 */
export const syncUserToFirebase = async (
  orkgUser: {
    id: string;
    email: string;
    display_name: string;
  },
  keycloakToken?: string
): Promise<FirebaseUser> => {
  try {
    // Use backend API for syncing user
    const firebaseUser = await syncUserApi(
      orkgUser,
      orkgUser.id,
      orkgUser.email,
      keycloakToken
    );
    return firebaseUser as FirebaseUser;
  } catch (error) {
    console.error('Error syncing user to Firebase:', error);
    throw error;
  }
};

/**
 * Check if current user is admin by checking Firebase
 */
export const checkUserIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const user = await getFirebaseUser(userId);
    return user?.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

const UserSync = {
  syncUserToFirebase,
  getFirebaseUser,
  checkUserIsAdmin,
};

export default UserSync;
