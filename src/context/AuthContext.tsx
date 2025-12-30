import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyPassword, generateToken, verifyToken } from '../utils/security';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('finance_token');
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          setUser({ username: payload.username });
        } else {
          localStorage.removeItem('finance_token');
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // 1. Get User Hash from API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) // Sending password just to identify flow, but API returns hash
      });

      if (!response.ok) return false;

      const data = await response.json();
      
      // 2. Verify Hash Client-Side (Legacy Security flow requested)
      const isValid = await verifyPassword(password, data.hash);
      
      if (isValid) {
        const token = await generateToken(username);
        localStorage.setItem('finance_token', token);
        setUser({ username });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('finance_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
