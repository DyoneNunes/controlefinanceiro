/**
 * feedbackCrypto.ts
 * Client-side encryption for the anonymous feedback channel.
 * Uses the native Web Crypto API (no external dependencies).
 *
 * Privacy model:
 *  - A random UUID (`thread_id`) is generated once and stored in localStorage.
 *  - This UUID is NOT linked to the user account or any personal data.
 *  - An AES-256-GCM key is derived from the thread_id via PBKDF2.
 *  - Only the ciphertext + IV + thread_id are ever sent to the server.
 */

const THREAD_ID_KEY = 'feedback_thread_id';

// Fixed domain-specific salt for PBKDF2 (public, not secret)
const PBKDF2_SALT = new TextEncoder().encode('meudin-feedback-v1-salt');

// ─────────────────────────────────────────────────────────────────
// Thread ID (anonymous session identifier)
// ─────────────────────────────────────────────────────────────────

/**
 * Returns the anonymous thread_id for this device/browser.
 * Creates and persists a new random UUID if one doesn't exist yet.
 * This identifier has NO connection to user account data.
 */
export function getOrCreateThreadId(): string {
  let id = localStorage.getItem(THREAD_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(THREAD_ID_KEY, id);
  }
  return id;
}

// ─────────────────────────────────────────────────────────────────
// Key derivation
// ─────────────────────────────────────────────────────────────────

async function deriveKey(threadId: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(threadId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: PBKDF2_SALT, iterations: 100_000, hash: 'SHA-256' },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─────────────────────────────────────────────────────────────────
// Base64 helpers (handles ArrayBuffer and Uint8Array)
// ─────────────────────────────────────────────────────────────────

function toBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string; // Base64-encoded AES-GCM ciphertext
  iv: string;         // Base64-encoded 12-byte IV
}

/**
 * Encrypts a plaintext string using the AES-256-GCM key derived from `threadId`.
 * Each call generates a fresh random IV.
 */
export async function encryptFeedback(plaintext: string, threadId: string): Promise<EncryptedPayload> {
  const key = await deriveKey(threadId);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  return { ciphertext: toBase64(cipherBuffer), iv: toBase64(iv) };
}

/**
 * Decrypts an EncryptedPayload using the AES-256-GCM key derived from `threadId`.
 * Throws if the key or ciphertext is invalid.
 */
export async function decryptFeedback(payload: EncryptedPayload, threadId: string): Promise<string> {
  const key = await deriveKey(threadId);
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plainBuffer);
}
