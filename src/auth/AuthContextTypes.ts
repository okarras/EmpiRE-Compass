import { createContext } from 'react';

interface UserData {
  display_name: string;
  email: string;
  id: string;
  created_at: string;
  is_admin?: boolean;
  is_curation_allowed?: boolean;
  observatory_id?: string | null;
  organization_id?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export type { UserData, AuthContextType };
