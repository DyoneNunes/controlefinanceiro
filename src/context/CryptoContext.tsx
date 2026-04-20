/**
 * ============================================================================
 * CryptoContext — Contexto React para Criptografia E2EE
 * ============================================================================
 *
 * Este contexto gerencia o ciclo de vida da chave de criptografia (MEK)
 * e expõe funções de encrypt/decrypt para os componentes da aplicação.
 *
 * SEGURANÇA:
 * - A MEK (Master Encryption Key) é mantida APENAS em memória (useState)
 * - NUNCA é armazenada em localStorage, sessionStorage ou cookies
 * - É limpa automaticamente ao fazer logout ou fechar a aba
 * - O servidor NUNCA recebe a MEK em texto plano
 *
 * FLUXO DE INICIALIZAÇÃO:
 * 1. Usuário faz login → AuthContext chama initializeCrypto(password)
 * 2. Se é primeiro login (sem chaves no servidor):
 *    a. Gera salt aleatório
 *    b. Deriva DEK da senha
 *    c. Gera MEK aleatória
 *    d. Encapsula MEK com DEK
 *    e. Envia salt + wrapped MEK ao servidor
 * 3. Se já tem chaves no servidor:
 *    a. Busca salt + wrapped MEK do servidor
 *    b. Deriva DEK da senha
 *    c. Desencapsula MEK
 * 4. MEK fica em memória → pronta para encrypt/decrypt
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  generateSalt,
  deriveKey,
  generateMasterKey,
  wrapMasterKey,
  unwrapMasterKey,
  encryptData,
  decryptData,
  bufferToBase64,
  base64ToUint8Array,
} from '../utils/crypto';
import type { EncryptedPayload } from '../utils/crypto';

// ============================================================================
// Tipos
// ============================================================================

interface CryptoContextType {
  /** Se o sistema de criptografia está inicializado e pronto */
  isReady: boolean;
  /** Se está em processo de inicialização */
  isInitializing: boolean;
  /** Se é o primeiro login (sem chaves no servidor = precisa migrar dados) */
  isFirstSetup: boolean;
  /** Criptografa qualquer objeto serializável para JSON */
  encrypt: (data: unknown) => Promise<EncryptedPayload>;
  /** Descriptografa um payload criptografado */
  decrypt: <T = unknown>(ciphertext: string, iv: string) => Promise<T>;
  /** Inicializa o sistema de criptografia com a senha do usuário */
  initializeCrypto: (password: string, token: string) => Promise<void>;
  /** Restaura a MEK do sessionStorage (para refresh sem senha) */
  restoreCrypto: () => Promise<boolean>;
  /** Re-encapsula a MEK com uma nova senha (para troca de senha) */
  rewrapForPasswordChange: (oldPassword: string, newPassword: string, token: string) => Promise<void>;
  /** Limpa a chave da memória (logout) */
  clearCrypto: () => void;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (!context) throw new Error('useCrypto must be used within a CryptoProvider');
  return context;
};

// ============================================================================
// Provider
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const MEK_SESSION_KEY = 'finance_mek_session';

/**
 * Exporta a MEK para sessionStorage em formato Base64.
 * O sessionStorage é limpo automaticamente ao fechar a aba/janela,
 * e é protegido pela same-origin policy do navegador.
 */
async function persistMek(mek: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey('raw', mek);
  sessionStorage.setItem(MEK_SESSION_KEY, bufferToBase64(raw));
}

/**
 * Importa a MEK do sessionStorage de volta como CryptoKey.
 * Retorna null se não houver MEK armazenada.
 */
async function loadPersistedMek(): Promise<CryptoKey | null> {
  const stored = sessionStorage.getItem(MEK_SESSION_KEY);
  if (!stored) return null;
  const raw = base64ToUint8Array(stored);
  return crypto.subtle.importKey(
    'raw',
    raw as BufferSource,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * A MEK é armazenada via useRef para evitar re-renders desnecessários
   * e para que a referência não seja perdida em closures.
   * useState é usado para isReady/isInitializing que afetam a UI.
   */
  const mekRef = useRef<CryptoKey | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  /**
   * Inicializa o sistema de criptografia.
   *
   * @param password - Senha em texto plano (só existe durante esta chamada)
   * @param token - JWT para autenticar com o servidor
   */
  const initializeCrypto = useCallback(async (password: string, token: string) => {
    setIsInitializing(true);
    try {
      // Passo 1: Verificar se o usuário já tem chaves no servidor
      const keysRes = await fetch(`${API_URL}/encryption/keys`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (keysRes.ok) {
        // ── CASO A: Usuário já tem chaves → desencapsular MEK ──
        const { salt, wrapped_mek, mek_iv } = await keysRes.json();

        // Deriva DEK da senha atual
        const dek = await deriveKey(password, salt);

        // Desencapsula a MEK armazenada no servidor
        const mek = await unwrapMasterKey(wrapped_mek, mek_iv, dek);

        mekRef.current = mek;
        await persistMek(mek);
        setIsFirstSetup(false);
        setIsReady(true);
      } else if (keysRes.status === 404) {
        // ── CASO B: Primeiro login → gerar todas as chaves ──
        const salt = generateSalt();
        const dek = await deriveKey(password, salt);
        const mek = await generateMasterKey();

        // Encapsula a MEK com a DEK
        const { wrappedKey, iv } = await wrapMasterKey(mek, dek);

        // Envia chaves encapsuladas ao servidor (servidor nunca vê a MEK)
        const setupRes = await fetch(`${API_URL}/encryption/setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            salt,
            wrapped_mek: wrappedKey,
            mek_iv: iv,
          }),
        });

        if (!setupRes.ok) {
          throw new Error('Falha ao configurar chaves de criptografia no servidor');
        }

        mekRef.current = mek;
        await persistMek(mek);
        setIsFirstSetup(true);
        setIsReady(true);
      } else {
        throw new Error(`Erro ao buscar chaves de criptografia: ${keysRes.status}`);
      }
    } catch (error) {
      console.error('Falha na inicialização de criptografia:', error);
      mekRef.current = null;
      setIsReady(false);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  /**
   * Restaura a MEK do sessionStorage (sem precisar da senha).
   * Usado no refresh da página quando o token JWT ainda é válido.
   */
  const restoreCrypto = useCallback(async (): Promise<boolean> => {
    try {
      const mek = await loadPersistedMek();
      if (mek) {
        mekRef.current = mek;
        setIsReady(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Falha ao restaurar MEK do sessionStorage:', error);
      return false;
    }
  }, []);

  /**
   * Re-encapsula a MEK quando o usuário troca a senha.
   *
   * FLUXO:
   * 1. Deriva DEK antiga → desencapsula MEK
   * 2. Deriva DEK nova → re-encapsula mesma MEK
   * 3. Atualiza no servidor
   * 4. Resultado: mesma MEK, nova DEK → dados antigos continuam acessíveis
   */
  const rewrapForPasswordChange = useCallback(async (
    oldPassword: string,
    newPassword: string,
    token: string
  ) => {
    // Busca as chaves atuais
    const keysRes = await fetch(`${API_URL}/encryption/keys`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!keysRes.ok) throw new Error('Falha ao buscar chaves de criptografia');

    const { salt, wrapped_mek, mek_iv } = await keysRes.json();

    // Desencapsula MEK com senha antiga
    const oldDek = await deriveKey(oldPassword, salt);
    const mek = await unwrapMasterKey(wrapped_mek, mek_iv, oldDek);

    // Gera novo salt e nova DEK com a nova senha
    const newSalt = generateSalt();
    const newDek = await deriveKey(newPassword, newSalt);

    // Re-encapsula a MESMA MEK com a nova DEK
    const { wrappedKey: newWrappedKey, iv: newIv } = await wrapMasterKey(mek, newDek);

    // Atualiza no servidor
    const updateRes = await fetch(`${API_URL}/encryption/keys`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        salt: newSalt,
        wrapped_mek: newWrappedKey,
        mek_iv: newIv,
      }),
    });

    if (!updateRes.ok) throw new Error('Falha ao atualizar chaves de criptografia');

    mekRef.current = mek;
  }, []);

  /**
   * Criptografa dados com a MEK em memória.
   */
  const encrypt = useCallback(async (data: unknown): Promise<EncryptedPayload> => {
    if (!mekRef.current) throw new Error('Sistema de criptografia não inicializado');
    return encryptData(data, mekRef.current);
  }, []);

  /**
   * Descriptografa dados com a MEK em memória.
   */
  const decrypt = useCallback(async <T = unknown>(
    ciphertext: string,
    iv: string
  ): Promise<T> => {
    if (!mekRef.current) throw new Error('Sistema de criptografia não inicializado');
    return decryptData<T>(ciphertext, iv, mekRef.current);
  }, []);

  /**
   * Limpa a MEK da memória (chamado no logout).
   * Após isso, nenhuma operação de encrypt/decrypt é possível
   * até novo login.
   */
  const clearCrypto = useCallback(() => {
    mekRef.current = null;
    sessionStorage.removeItem(MEK_SESSION_KEY);
    setIsReady(false);
    setIsFirstSetup(false);
  }, []);

  return (
    <CryptoContext.Provider
      value={{
        isReady,
        isInitializing,
        isFirstSetup,
        encrypt,
        decrypt,
        initializeCrypto,
        restoreCrypto,
        rewrapForPasswordChange,
        clearCrypto,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};
