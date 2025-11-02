import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Firebase User Sync Service
 * Syncs ORKG/Keycloak users to Firebase Users collection
 * Enables Firebase security rules to check user permissions
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
 * Admin user emails (only these users can edit data)
 * Using email is more reliable than user IDs
 */
const ADMIN_USER_EMAILS = [
  'amirrezaalasti@gmail.com', // Amirreza Alasti
  'oliver.karras@tib.eu', // Oliver Karras
];

/**
 * Check if a user email is an admin
 */
export const isAdminUser = (email: string): boolean => {
  return ADMIN_USER_EMAILS.includes(email.toLowerCase());
};

/**
 * Get user from Firebase
 */
export const getFirebaseUser = async (
  userId: string
): Promise<FirebaseUser | null> => {
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
 * Sync ORKG user to Firebase Users collection
 * This ensures Firebase rules can check user permissions
 */
export const syncUserToFirebase = async (orkgUser: {
  id: string;
  email: string;
  display_name: string;
}): Promise<FirebaseUser> => {
  try {
    const userId = orkgUser.id;
    const userRef = doc(db, 'Users', userId);

    // Check if user already exists
    const existingUser = await getDoc(userRef);

    // Check if user is admin based on email
    const isAdmin = isAdminUser(orkgUser.email);

    if (existingUser.exists()) {
      // Update existing user (update last_login, preserve other fields)
      const userData = existingUser.data() as FirebaseUser;
      const updatedUser: FirebaseUser = {
        ...userData,
        email: orkgUser.email,
        display_name: orkgUser.display_name,
        last_login: new Date().toISOString(),
        is_admin: isAdmin, // Update admin status
      };

      await setDoc(userRef, updatedUser, { merge: true });
      return updatedUser;
    } else {
      // Create new user
      const newUser: FirebaseUser = {
        id: userId,
        email: orkgUser.email,
        display_name: orkgUser.display_name,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_admin: isAdmin,
        is_curation_allowed: false,
        observatory_id: null,
        organization_id: null,
      };

      await setDoc(userRef, newUser);

      return newUser;
    }
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

/**
 * Check if email is an admin email
 */
export const checkEmailIsAdmin = (email: string): boolean => {
  return isAdminUser(email);
};

const UserSync = {
  syncUserToFirebase,
  getFirebaseUser,
  isAdminUser,
  checkUserIsAdmin,
  checkEmailIsAdmin,
};

export default UserSync;
