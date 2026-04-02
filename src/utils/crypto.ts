/**
 * ============================================================================
 * Módulo de Criptografia E2EE (End-to-End Encryption)
 * ============================================================================
 *
 * Implementa criptografia de ponta-a-ponta usando Web Crypto API nativa.
 *
 * ARQUITETURA DE CHAVES:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Senha do Usuário                                          │
 * │       │                                                     │
 * │       ▼                                                     │
 * │  PBKDF2 (600.000 iterações, SHA-256, salt 16 bytes)        │
 * │       │                                                     │
 * │       ▼                                                     │
 * │  DEK (Data Encryption Key) ── AES-256-GCM                  │
 * │       │                                                     │
 * │       ├── Encapsula (wrap) a MEK                            │
 * │       │                                                     │
 * │       ▼                                                     │
 * │  MEK (Master Encryption Key) ── AES-256-GCM (aleatória)    │
 * │       │                                                     │
 * │       ├── Criptografa dados reais (bills, incomes, etc.)    │
 * │       │                                                     │
 * │       ▼                                                     │
 * │  Dados criptografados + IV armazenados no servidor          │
 * └─────────────────────────────────────────────────────────────┘
 *
 * SEGURANÇA DO IV (Initialization Vector):
 * - O IV é um nonce de 12 bytes gerado aleatoriamente para CADA operação
 *   de criptografia. Ele garante que mesmo dados idênticos produzam
 *   ciphertexts diferentes.
 * - O IV NÃO é segredo — ele é armazenado em texto plano junto ao
 *   ciphertext. Sua função é garantir unicidade, não confidencialidade.
 * - NUNCA reutilize o mesmo IV com a mesma chave. Isso comprometeria
 *   completamente a segurança do AES-GCM.
 *
 * POR QUE AES-256-GCM:
 * - Fornece confidencialidade (criptografia) E integridade (autenticação)
 * - O "tag" de 128 bits garante que os dados não foram adulterados
 * - Qualquer tentativa de alterar o ciphertext resultará em falha na
 *   descriptografia, protegendo contra ataques de manipulação
 */

// ============================================================================
// Constantes de Configuração
// ============================================================================

/**
 * Número de iterações do PBKDF2.
 * OWASP recomenda >= 600.000 para PBKDF2-SHA256 (2023+).
 * Quanto maior, mais lento o brute-force contra a senha.
 */
const PBKDF2_ITERATIONS = 600_000;

/** Tamanho do salt para derivação de chave (16 bytes = 128 bits) */
const SALT_LENGTH = 16;

/**
 * Tamanho do IV (Initialization Vector) para AES-GCM.
 * O NIST recomenda 12 bytes (96 bits) para AES-GCM.
 * Com 12 bytes, temos 2^96 possíveis IVs — colisão extremamente improvável.
 */
const IV_LENGTH = 12;

/** Tamanho da chave AES em bits (256 = máxima segurança) */
const AES_KEY_LENGTH = 256;

// ============================================================================
// Funções Auxiliares de Codificação
// ============================================================================

/**
 * Converte ArrayBuffer para string Base64.
 * Base64 é usado para serializar dados binários em formato texto,
 * permitindo armazenamento e transporte via JSON/HTTP.
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Converte string Base64 de volta para ArrayBuffer */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Codifica string UTF-8 para ArrayBuffer (para criptografia) */
function encode(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

/** Decodifica ArrayBuffer para string UTF-8 (após descriptografia) */
function decode(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// ============================================================================
// Geração de Salt
// ============================================================================

/**
 * Gera um salt criptograficamente seguro.
 *
 * O salt é um valor aleatório usado como input adicional na derivação
 * de chave (PBKDF2). Ele garante que:
 * 1. Duas senhas iguais produzam chaves diferentes
 * 2. Ataques de rainbow table sejam impraticáveis
 *
 * O salt NÃO é segredo — ele é armazenado no servidor em texto plano.
 * Sua função é garantir unicidade, não confidencialidade.
 *
 * @returns Salt em formato Base64
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return bufferToBase64(salt.buffer);
}

// ============================================================================
// Derivação de Chave (PBKDF2)
// ============================================================================

/**
 * Deriva uma chave AES-256-GCM a partir da senha do usuário usando PBKDF2.
 *
 * PBKDF2 (Password-Based Key Derivation Function 2) transforma uma senha
 * fraca (baixa entropia) em uma chave criptográfica forte (alta entropia)
 * através de milhares de iterações de hash.
 *
 * FLUXO:
 * 1. Importa a senha como "raw key material" (não é uma chave real ainda)
 * 2. Aplica PBKDF2 com SHA-256, salt e 600.000 iterações
 * 3. Produz uma CryptoKey AES-GCM de 256 bits
 *
 * A chave resultante:
 * - Só pode ser usada para wrap/unwrap (encapsular a MEK)
 * - NÃO pode ser exportada (proteção contra exfiltração)
 * - Existe apenas em memória no navegador
 *
 * @param password - Senha em texto plano do usuário
 * @param saltBase64 - Salt em Base64 (armazenado no servidor)
 * @returns CryptoKey para AES-GCM (DEK - Data Encryption Key)
 */
export async function deriveKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  // Passo 1: Importa a senha como material bruto
  // 'raw' = bytes UTF-8 da senha, sem processamento
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encode(password),
    { name: 'PBKDF2' },
    false, // não exportável
    ['deriveKey'] // só pode derivar chaves
  );

  // Passo 2: Deriva a chave AES-256-GCM via PBKDF2
  const salt = base64ToBuffer(saltBase64);
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH, // 256 bits
    },
    false, // não exportável — proteção contra XSS
    ['wrapKey', 'unwrapKey'] // usada apenas para encapsular/desencapsular a MEK
  );

  return derivedKey;
}

// ============================================================================
// Master Encryption Key (MEK) — Geração e Gerenciamento
// ============================================================================

/**
 * Gera uma nova Master Encryption Key (MEK) aleatória.
 *
 * A MEK é uma chave AES-256-GCM gerada aleatoriamente que:
 * - Criptografa/descriptografa TODOS os dados do usuário
 * - É encapsulada (wrapped) pela DEK derivada da senha
 * - Permite troca de senha sem re-criptografar todos os dados
 *
 * @returns CryptoKey exportável (para poder ser wrapped)
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true, // exportável = true (necessário para wrap/unwrap)
    ['encrypt', 'decrypt']
  );
}

/**
 * Encapsula (wrap) a MEK com a DEK.
 *
 * "Wrapping" é o processo de criptografar uma chave com outra chave.
 * A MEK é criptografada com a DEK (derivada da senha) usando AES-GCM.
 *
 * Isso permite:
 * - Armazenar a MEK no servidor de forma segura (o servidor não tem a DEK)
 * - Trocar a senha: re-derive a nova DEK e re-wrap a MEK existente
 *   sem precisar re-criptografar GB de dados
 *
 * @param mek - Master Encryption Key a ser encapsulada
 * @param dek - Data Encryption Key (derivada da senha) usada para encapsular
 * @returns Objeto com a MEK encapsulada e o IV usado, ambos em Base64
 */
export async function wrapMasterKey(
  mek: CryptoKey,
  dek: CryptoKey
): Promise<{ wrappedKey: string; iv: string }> {
  // IV único para esta operação de wrap
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encapsula a MEK usando AES-GCM com a DEK
  const wrappedKeyBuffer = await crypto.subtle.wrapKey(
    'raw', // formato de exportação da chave interna
    mek,
    dek,
    { name: 'AES-GCM', iv }
  );

  return {
    wrappedKey: bufferToBase64(wrappedKeyBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Desencapsula (unwrap) a MEK usando a DEK.
 *
 * Processo reverso do wrap: descriptografa a MEK armazenada no servidor
 * usando a DEK derivada da senha do usuário.
 *
 * Se a senha estiver errada → a DEK será diferente → unwrap falhará
 * → dados permanecem seguros.
 *
 * @param wrappedKeyBase64 - MEK encapsulada em Base64 (do servidor)
 * @param ivBase64 - IV usado no wrap em Base64 (do servidor)
 * @param dek - DEK derivada da senha atual do usuário
 * @returns CryptoKey da MEK, pronta para criptografar/descriptografar dados
 */
export async function unwrapMasterKey(
  wrappedKeyBase64: string,
  ivBase64: string,
  dek: CryptoKey
): Promise<CryptoKey> {
  const wrappedKey = base64ToBuffer(wrappedKeyBase64);
  const iv = base64ToBuffer(ivBase64);

  return crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    dek,
    { name: 'AES-GCM', iv },
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true, // exportável (para re-wrap se a senha mudar)
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// Criptografia e Descriptografia de Dados
// ============================================================================

/** Formato do dado criptografado retornado pelas funções de encrypt */
export interface EncryptedPayload {
  /** Dados criptografados em Base64 */
  ciphertext: string;
  /**
   * IV (Initialization Vector) em Base64.
   *
   * O IV é gerado aleatoriamente para CADA operação de criptografia.
   * Ele DEVE ser armazenado junto ao ciphertext, pois é necessário
   * para descriptografar. O IV não precisa ser segredo.
   *
   * CRÍTICO: Nunca reutilize o mesmo IV com a mesma chave.
   * AES-GCM com IV repetido permite recuperar a chave e o plaintext.
   */
  iv: string;
}

/**
 * Criptografa dados usando AES-256-GCM.
 *
 * FLUXO:
 * 1. Gera IV aleatório de 12 bytes (único por operação)
 * 2. Serializa o objeto para JSON string
 * 3. Codifica para bytes UTF-8
 * 4. Criptografa com AES-GCM usando a MEK e o IV
 * 5. Retorna ciphertext + IV em Base64
 *
 * O AES-GCM automaticamente:
 * - Criptografa os dados (confidencialidade)
 * - Gera um authentication tag de 128 bits (integridade)
 * - O tag é anexado ao final do ciphertext automaticamente
 *
 * @param data - Qualquer objeto serializável para JSON
 * @param key - MEK (Master Encryption Key)
 * @returns Payload criptografado com ciphertext e IV em Base64
 */
export async function encryptData(
  data: unknown,
  key: CryptoKey
): Promise<EncryptedPayload> {
  // IV aleatório — NUNCA reutilize com a mesma chave
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Serializa e codifica para bytes
  const plaintext = JSON.stringify(data);
  const encodedData = encode(plaintext);

  // Criptografa com AES-256-GCM
  // O resultado inclui automaticamente o authentication tag (16 bytes)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Descriptografa dados criptografados com AES-256-GCM.
 *
 * FLUXO:
 * 1. Decodifica ciphertext e IV de Base64 para ArrayBuffer
 * 2. Descriptografa usando AES-GCM com a MEK e o IV original
 * 3. AES-GCM automaticamente verifica o authentication tag
 * 4. Se os dados foram adulterados → EXCEÇÃO (garante integridade)
 * 5. Decodifica bytes UTF-8 para string
 * 6. Parse JSON de volta para objeto
 *
 * @param ciphertextBase64 - Dados criptografados em Base64
 * @param ivBase64 - IV original usado na criptografia, em Base64
 * @param key - MEK (mesma chave usada para criptografar)
 * @returns Objeto original descriptografado
 * @throws Error se os dados foram adulterados ou a chave está errada
 */
export async function decryptData<T = unknown>(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<T> {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);

  // Descriptografa e verifica integridade automaticamente
  // Se o tag não bater → DOMException: The operation failed
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  // Decodifica bytes para string e faz parse do JSON
  const jsonString = decode(plaintext);
  return JSON.parse(jsonString) as T;
}
