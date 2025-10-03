import React, { useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getUserInfo } from './authUtils';
import {
  AuthContext,
  UserData,
  type AuthContextType,
} from './AuthContextTypes';

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
      // Save to Firebase (fire and forget - don't block UI)
      const saveToFirebase = async () => {
        try {
          if (!keycloak.token) {
            return;
          }
          const userInfo = await getUserInfo(keycloak.token);
          if (!userInfo) {
            return;
          }
          setUser(userInfo);
          console.log('User info:', userInfo);
          const userRef = doc(collection(db, 'Users'), userInfo.id);
          await setDoc(userRef, userInfo, { merge: true });
        } catch (firebaseError) {
          console.error('Failed to save user to Firebase:', firebaseError);
          // Don't set error for Firebase failures - it's not critical for auth
        }
      };

      saveToFirebase();
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
