import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../api/apiClient';

export interface UserSession {
  officerId: string;
  role: string;
  department: string | null;
  email?: string | null;
  fullName?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, role: string, officerId: string, department: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage Note: Using sessionStorage for JWT storage during hackathon/demo to balance XSS security
// with state persistence across page refreshes. In production, HTTPS HttpOnly cookies are recommended.
const TOKEN_KEY = 'tejas_access_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restoreSession() {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const response = await apiClient.get('/auth/me');
        setUser({
          officerId: response.data.officer_id,
          role: response.data.role,
          department: response.data.department,
          email: response.data.email,
          fullName: response.data.full_name
        });
      } catch (err) {
        console.warn('Session restoration failed or token expired:', err);
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = (newToken: string, role: string, officerId: string, department: string | null) => {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser({
      officerId,
      role,
      department
    });
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
