import React, { useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { getUserInfo } from './authUtils';
import {
  AuthContext,
  UserData,
  type AuthContextType,
} from './AuthContextTypes';
import UserSync from '../firestore/UserSync';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContextProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<UserData | null>(null);
  // Derive authentication state from Keycloak only
  const isAuthenticated = keycloak?.authenticated || false;
  const isLoading = !initialized;

  // Save user data to Firebase when authenticated
  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (isAuthenticated && keycloak.token) {
      // Sync user to Firebase (fire and forget - don't block UI)
      const syncToFirebase = async () => {
        try {
          if (!keycloak.token) {
            return;
          }
          const userInfo = await getUserInfo(keycloak.token);
          if (!userInfo) {
            return;
          }

          // Sync to Firebase with admin status check
          const firebaseUser = await UserSync.syncUserToFirebase({
            id: userInfo.id,
            email: userInfo.email,
            display_name: userInfo.display_name,
          });

          // Update local state with Firebase user data (includes is_admin)
          setUser({
            ...userInfo,
            is_admin: firebaseUser.is_admin,
          } as UserData);

          console.log('✅ User authenticated:', {
            name: firebaseUser.display_name,
            isAdmin: firebaseUser.is_admin,
          });
        } catch (firebaseError) {
          console.error('Failed to sync user to Firebase:', firebaseError);
          // Don't set error for Firebase failures - it's not critical for auth
          // But set user anyway so UI can work
          const userInfo = await getUserInfo(keycloak.token!);
          if (userInfo) {
            setUser(userInfo);
          }
        }
      };

      syncToFirebase();
    }
  }, [isAuthenticated, initialized, keycloak.token]);

  const login = async () => {
    if (!keycloak) {
      setError('Authentication service not available');
      return;
    }

    try {
      setError(null);
      await keycloak.login();
    } catch (loginError) {
      console.error('Login error:', loginError);
      setError('Login failed. Please try again.');
    }
  };

  const logout = async () => {
    if (!keycloak) return;

    try {
      setError(null);
      // Logout from Keycloak
      await keycloak.logout({ redirectUri: window.location.origin });
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
      setError('Logout failed. Please try again.');
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContextProvider };
