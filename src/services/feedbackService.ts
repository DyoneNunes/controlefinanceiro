/**
 * feedbackService.ts
 * API service for the anonymous feedback channel.
 *
 * Currently MOCKED — all functions return simulated Promises.
 * To integrate a real backend, replace each MOCK section with the
 * commented-out fetch() implementation beneath it.
 *
 * Privacy contract:
 *  - No Authorization header is sent (feedback is anonymous).
 *  - The payload contains only: thread_id (random UUID), ciphertext, iv.
 *  - No user PII ever leaves the client in clear text.
 */

import { encryptFeedback } from '../utils/feedbackCrypto';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface FeedbackMessage {
  id: string;
  thread_id: string;
  ciphertext: string;
  iv: string;
  sender: 'user' | 'admin';
  created_at: string;
}

export interface SendMessagePayload {
  thread_id: string;
  ciphertext: string;
  iv: string;
}

// ─────────────────────────────────────────────────────────────────
// Mock in-memory store (remove when connecting real backend)
// ─────────────────────────────────────────────────────────────────

const MOCK_STORE: FeedbackMessage[] = [];

const ADMIN_CANNED_RESPONSES = [
  'Obrigado pelo seu feedback! Vamos analisar e retornar em breve.',
  'Mensagem recebida. Sua opinião é muito importante para nós!',
  'Agradecemos o contato. Iremos verificar o que foi relatado.',
];

// ─────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────

/**
 * Sends an encrypted message to the feedback channel.
 * Payload: { thread_id, ciphertext, iv } — no user identity.
 *
 * REAL BACKEND:
 *   POST /api/feedback
 *   Body: SendMessagePayload
 *   Response: FeedbackMessage
 */
export async function sendMessage(payload: SendMessagePayload): Promise<FeedbackMessage> {
  // ── MOCK ──────────────────────────────────────────────────────
  await delay(350);

  const userMsg: FeedbackMessage = {
    id: crypto.randomUUID(),
    thread_id: payload.thread_id,
    ciphertext: payload.ciphertext,
    iv: payload.iv,
    sender: 'user',
    created_at: new Date().toISOString(),
  };
  MOCK_STORE.push(userMsg);

  // Simulate an admin auto-reply after 2 seconds
  setTimeout(async () => {
    const replyText = ADMIN_CANNED_RESPONSES[MOCK_STORE.length % ADMIN_CANNED_RESPONSES.length];
    const encrypted = await encryptFeedback(replyText, payload.thread_id);
    MOCK_STORE.push({
      id: crypto.randomUUID(),
      thread_id: payload.thread_id,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      sender: 'admin',
      created_at: new Date().toISOString(),
    });
  }, 2000);

  return userMsg;
  // ── END MOCK ──────────────────────────────────────────────────

  // ── REAL IMPLEMENTATION ───────────────────────────────────────
  // const res = await fetch('/api/feedback', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   // NOTE: No Authorization header — feedback is anonymous
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error('Falha ao enviar mensagem');
  // return res.json();
}

/**
 * Fetches all messages for the given anonymous thread.
 *
 * REAL BACKEND:
 *   GET /api/feedback/:thread_id
 *   Response: FeedbackMessage[]
 */
export async function fetchMessages(threadId: string): Promise<FeedbackMessage[]> {
  // ── MOCK ──────────────────────────────────────────────────────
  await delay(250);
  return MOCK_STORE.filter(m => m.thread_id === threadId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  // ── END MOCK ──────────────────────────────────────────────────

  // ── REAL IMPLEMENTATION ───────────────────────────────────────
  // const res = await fetch(`/api/feedback/${threadId}`);
  //   // NOTE: No Authorization header
  // if (!res.ok) throw new Error('Falha ao buscar mensagens');
  // return res.json();
}

/**
 * [ADMIN] Fetches all feedback messages across all threads.
 *
 * REAL BACKEND:
 *   GET /api/admin/feedback
 *   Headers: { Authorization: Bearer <admin_token> }
 *   Response: FeedbackMessage[]
 */
export async function fetchAllFeedbackMessages(): Promise<FeedbackMessage[]> {
  // ── MOCK ──────────────────────────────────────────────────────
  await delay(200);
  return [...MOCK_STORE].sort((a, b) => a.created_at.localeCompare(b.created_at));
  // ── END MOCK ──────────────────────────────────────────────────

  // ── REAL IMPLEMENTATION ───────────────────────────────────────
  // const res = await fetch('/api/admin/feedback', {
  //   headers: { Authorization: `Bearer ${adminToken}` },
  // });
  // if (!res.ok) throw new Error('Falha ao buscar feedbacks');
  // return res.json();
}

/**
 * [ADMIN] Sends an encrypted admin reply to a thread.
 *
 * REAL BACKEND:
 *   POST /api/admin/feedback/reply
 *   Headers: { Authorization: Bearer <admin_token> }
 *   Body: SendMessagePayload
 */
export async function sendAdminReply(payload: SendMessagePayload): Promise<FeedbackMessage> {
  // ── MOCK ──────────────────────────────────────────────────────
  await delay(200);
  const msg: FeedbackMessage = {
    id: crypto.randomUUID(),
    thread_id: payload.thread_id,
    ciphertext: payload.ciphertext,
    iv: payload.iv,
    sender: 'admin',
    created_at: new Date().toISOString(),
  };
  MOCK_STORE.push(msg);
  return msg;
  // ── END MOCK ──────────────────────────────────────────────────

  // ── REAL IMPLEMENTATION ───────────────────────────────────────
  // const res = await fetch('/api/admin/feedback/reply', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error('Falha ao enviar resposta');
  // return res.json();
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
