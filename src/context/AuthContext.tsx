/**
 * ============================================================================
 * AuthContext — Integrado com E2EE
 * ============================================================================
 *
 * Fluxo de login atualizado:
 * 1. Autentica com username/password → recebe JWT
 * 2. Inicializa criptografia: deriva DEK → desencapsula MEK
 * 3. Se primeiro login pós-E2EE: gera chaves e envia wrapped MEK ao servidor
 * 4. MEK fica em memória → pronta para encrypt/decrypt
 *
 * No logout: limpa token E limpa chave de criptografia da memória.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken, removeToken } from '../utils/security';
import { useCrypto } from './CryptoContext';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const { initializeCrypto, restoreCrypto, clearCrypto } = useCrypto();

  // Check for existing token on mount
  useEffect(() => {
    const checkSession = async () => {
      const currentToken = getToken();
      if (currentToken) {
        try {
          const res = await fetch(`${API_URL}/auth/validate`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser({ username: data.username });
            setTokenState(currentToken);
            // Tenta restaurar a MEK do sessionStorage (sobrevive a refresh)
            await restoreCrypto();
          } else {
            removeToken();
            setTokenState(null);
          }
        } catch (e) {
          removeToken();
          setTokenState(null);
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) return false;

      const data = await response.json();
      
      if (data.token) {
        setToken(data.token);
        setTokenState(data.token);
        setUser({ username: data.username });

        // ── INICIALIZAÇÃO DO SISTEMA E2EE ──
        // Acontece APÓS autenticação bem-sucedida.
        // A senha é usada para derivar a DEK e desencapsular a MEK.
        // Após esta chamada, a senha NÃO é retida — apenas a MEK
        // fica em memória (via CryptoContext).
        try {
          await initializeCrypto(password, data.token);
        } catch (cryptoError) {
          console.error('Falha ao inicializar criptografia E2EE:', cryptoError);
          // Não bloqueia o login — o usuário pode usar a app sem E2EE
          // (dados legacy em texto plano continuam acessíveis)
        }

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
    setTokenState(null);
    removeToken();
    // Limpa a MEK da memória ao sair — essencial para segurança
    clearCrypto();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
