import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import UserSync, { FirebaseUser } from '../firestore/UserSync';

/**
 * Authentication hook that provides Keycloak state + Firebase user data
 * This is the single source of truth for authentication data
 */
export const useAuthData = () => {
  const keycloakAuth = useAuth();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingFirebaseUser, setIsLoadingFirebaseUser] = useState(false);

  // Fetch Firebase user data when authenticated
  useEffect(() => {
    if (keycloakAuth.isAuthenticated && keycloakAuth.user?.id) {
      setIsLoadingFirebaseUser(true);
      UserSync.getFirebaseUser(keycloakAuth.user.id)
        .then((fbUser) => {
          setFirebaseUser(fbUser);
          setIsLoadingFirebaseUser(false);
        })
        .catch((err) => {
          console.error('Error fetching Firebase user:', err);
          setIsLoadingFirebaseUser(false);
        });
    } else {
      setFirebaseUser(null);
      setIsLoadingFirebaseUser(false);
    }
  }, [keycloakAuth.isAuthenticated, keycloakAuth.user?.id]);

  // Merge Keycloak user with Firebase user data
  const mergedUser = keycloakAuth.user
    ? {
        ...keycloakAuth.user,
        ...firebaseUser,
        is_admin: firebaseUser?.is_admin || false,
      }
    : null;

  return {
    isAuthenticated: keycloakAuth.isAuthenticated,
    isLoading: keycloakAuth.isLoading || isLoadingFirebaseUser,
    user: mergedUser,
    login: keycloakAuth.login,
    logout: keycloakAuth.logout,
    error: keycloakAuth.error,
  };
};
