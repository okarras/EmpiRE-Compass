import { db } from '../config/firebase.js';
import { isAdminEmail } from '../config/constants.js';

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

export interface SyncUserRequest {
  id: string;
  email: string;
  display_name: string;
}

/**
 * Get user from Firebase
 */
export const getFirebaseUser = async (
  userId: string
): Promise<FirebaseUser | null> => {
  try {
    const userDoc = await db.collection('Users').doc(userId).get();

    if (userDoc.exists) {
      return { id: userDoc.id, ...userDoc.data() } as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user from Firebase:', error);
    throw error;
  }
};

/**
 * Get recent users from Firebase (newest first)
 */
export const listFirebaseUsers = async (
  limitCount = 50
): Promise<FirebaseUser[]> => {
  try {
    const snapshot = await db
      .collection('Users')
      .orderBy('created_at', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseUser
    );
  } catch (error) {
    console.error('Error listing users from Firebase:', error);
    throw error;
  }
};

/**
 * Sync ORKG/Keycloak user to Firebase Users collection
 * This should only be called from backend with proper authentication
 */
export const syncUserToFirebase = async (
  orkgUser: SyncUserRequest
): Promise<FirebaseUser> => {
  try {
    const userId = orkgUser.id;
    const userRef = db.collection('Users').doc(userId);

    // Check if user already exists
    const existingUserDoc = await userRef.get();

    // Check if user is admin based on email
    const isAdmin = isAdminEmail(orkgUser.email);

    if (existingUserDoc.exists) {
      // Update existing user (update last_login, preserve other fields)
      const userData = existingUserDoc.data() as FirebaseUser;
      const updatedUser: FirebaseUser = {
        ...userData,
        email: orkgUser.email,
        display_name: orkgUser.display_name,
        last_login: new Date().toISOString(),
        is_admin: isAdmin, // Update admin status
      };

      await userRef.set(updatedUser, { merge: true });
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

      await userRef.set(newUser);
      return newUser;
    }
  } catch (error) {
    console.error('Error syncing user to Firebase:', error);
    throw error;
  }
};

/**
 * Update user's admin role
 */
export const updateUserAdminRole = async (
  userId: string,
  isAdmin: boolean
): Promise<FirebaseUser> => {
  try {
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    await userRef.set({ is_admin: isAdmin }, { merge: true });
    const updated = await userRef.get();
    return { id: updated.id, ...updated.data() } as FirebaseUser;
  } catch (error) {
    console.error('Error updating user admin role:', error);
    throw error;
  }
};

/**
 * Delete user by id
 */
export const deleteFirebaseUser = async (userId: string): Promise<void> => {
  try {
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    await userRef.delete();
  } catch (error) {
    console.error('Error deleting Firebase user:', error);
    throw error;
  }
};

/**
 * Check if user is admin
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
