/**
 * feedbackService.ts
 * API service for the anonymous feedback channel.
 *
 * Privacy contract:
 *  - User endpoints (sendMessage, fetchMessages) send NO Authorization header.
 *  - Payload contains only: thread_id (random UUID), ciphertext, iv.
 *  - Admin endpoints carry the admin JWT from sessionStorage.
 */

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const ADMIN_TOKEN_KEY = 'meudim_admin_token';

function adminAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─────────────────────────────────────────────────────────────────
// Service functions
// ─────────────────────────────────────────────────────────────────

export async function sendMessage(payload: SendMessagePayload): Promise<FeedbackMessage> {
  const res = await fetch(`${API_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao enviar mensagem');
  return res.json();
}

export async function fetchMessages(threadId: string): Promise<FeedbackMessage[]> {
  const res = await fetch(`${API_URL}/feedback/${threadId}`);
  if (!res.ok) throw new Error('Falha ao buscar mensagens');
  return res.json();
}

export async function fetchAllFeedbackMessages(): Promise<FeedbackMessage[]> {
  const res = await fetch(`${API_URL}/feedback/admin/list`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error('Falha ao buscar feedbacks');
  return res.json();
}

export async function sendAdminReply(payload: SendMessagePayload): Promise<FeedbackMessage> {
  const res = await fetch(`${API_URL}/feedback/admin/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao enviar resposta');
  return res.json();
}

// ─────────────────────────────────────────────────────────────────
// Realtime (Server-Sent Events)
// ─────────────────────────────────────────────────────────────────
// EventSource has built-in auto-reconnect; the server sets `retry: 3000`.
// Stream payloads are discriminated by `kind`:
//   - { kind: 'message', ...FeedbackMessage } — persisted message
//   - { kind: 'typing', thread_id, sender, at } — ephemeral indicator

export interface TypingEvent {
  thread_id: string;
  sender: 'user' | 'admin';
  at: number;
}

export interface StreamHandlers {
  onMessage?: (msg: FeedbackMessage) => void;
  onTyping?: (ev: TypingEvent) => void;
}

function openEventSource(url: string, handlers: StreamHandlers): () => void {
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data?.kind === 'typing') handlers.onTyping?.(data as TypingEvent);
      else if (data?.id) handlers.onMessage?.(data as FeedbackMessage);
    } catch {
      // Heartbeats and malformed payloads are ignored.
    }
  };
  return () => es.close();
}

export function streamUserMessages(
  threadId: string,
  handlers: StreamHandlers,
): () => void {
  return openEventSource(`${API_URL}/feedback/${threadId}/stream`, handlers);
}

export function streamAdminMessages(handlers: StreamHandlers): () => void {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  // EventSource cannot send Authorization headers — token rides on the query string.
  const url = `${API_URL}/feedback/admin/stream?token=${encodeURIComponent(token ?? '')}`;
  return openEventSource(url, handlers);
}

// Typing notifications — fire-and-forget. Errors are swallowed because a
// dropped indicator is harmless; the next keystroke will retry.
export function signalUserTyping(threadId: string): void {
  fetch(`${API_URL}/feedback/${threadId}/typing`, { method: 'POST' }).catch(() => {});
}

export function signalAdminTyping(threadId: string): void {
  fetch(`${API_URL}/feedback/admin/typing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminAuthHeaders() },
    body: JSON.stringify({ thread_id: threadId }),
  }).catch(() => {});
}
