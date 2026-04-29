import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Lock, RefreshCw, Shield } from 'lucide-react';
import { getOrCreateThreadId, encryptFeedback, decryptFeedback } from '../utils/feedbackCrypto';
import {
  sendMessage,
  fetchMessages,
  streamUserMessages,
  signalUserTyping,
} from '../services/feedbackService';
import type { FeedbackMessage } from '../services/feedbackService';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface DisplayMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

export const FeedbackChat = () => {
  const threadId = getOrCreateThreadId();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks IDs already shown to avoid flicker on re-fetch
  const knownIds = useRef<Set<string>>(new Set());
  // Throttle outgoing typing signals to once per 3 s.
  const lastTypingSentAt = useRef<number>(0);

  const [adminTyping, setAdminTyping] = useState(false);
  const adminTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Decrypt raw server messages ──────────────────────────────

  const decryptAll = useCallback(async (raw: FeedbackMessage[]): Promise<DisplayMessage[]> => {
    return Promise.all(
      raw.map(async (m) => {
        let text = '(mensagem criptografada)';
        try {
          text = await decryptFeedback({ ciphertext: m.ciphertext, iv: m.iv }, threadId);
        } catch {
          // Decryption failure is non-fatal — display placeholder
        }
        return { id: m.id, sender: m.sender, text, created_at: m.created_at };
      })
    );
  }, [threadId]);

  // ── Fetch & decrypt messages ─────────────────────────────────

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setError(null);
    try {
      const raw = await fetchMessages(threadId);
      const decrypted = await decryptAll(raw);
      setMessages(decrypted);
      decrypted.forEach(m => knownIds.current.add(m.id));
    } catch {
      if (!silent) setError('Não foi possível carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  }, [threadId, decryptAll]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime: subscribe to SSE for this thread. EventSource auto-reconnects.
  useEffect(() => {
    const close = streamUserMessages(threadId, {
      onMessage: async (raw) => {
        if (knownIds.current.has(raw.id)) return;
        knownIds.current.add(raw.id);
        let text = '(mensagem criptografada)';
        try {
          text = await decryptFeedback({ ciphertext: raw.ciphertext, iv: raw.iv }, threadId);
        } catch { /* keep placeholder */ }
        setMessages(prev =>
          prev.some(m => m.id === raw.id)
            ? prev
            : [...prev, { id: raw.id, sender: raw.sender, text, created_at: raw.created_at }],
        );
        // Admin just sent a real message — clear the indicator.
        if (raw.sender === 'admin') setAdminTyping(false);
      },
      onTyping: (ev) => {
        if (ev.sender !== 'admin') return;
        setAdminTyping(true);
        if (adminTypingTimer.current) clearTimeout(adminTypingTimer.current);
        adminTypingTimer.current = setTimeout(() => setAdminTyping(false), 4000);
      },
    });
    return () => {
      close();
      if (adminTypingTimer.current) clearTimeout(adminTypingTimer.current);
    };
  }, [threadId]);

  // ── Auto-scroll to bottom on new messages ────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, adminTyping]);

  // ── Send message ─────────────────────────────────────────────

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');
    setError(null);

    // Optimistic update — show message immediately
    const tempId = `temp-${Date.now()}`;
    const optimistic: DisplayMessage = {
      id: tempId,
      sender: 'user',
      text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const encrypted = await encryptFeedback(text, threadId);
      const saved = await sendMessage({
        thread_id: threadId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
      });

      // Replace optimistic entry with server-confirmed ID. The SSE stream will
      // deliver the same message — knownIds dedupes it on arrival.
      knownIds.current.add(saved.id);
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, id: saved.id } : m))
      );
    } catch {
      // Remove optimistic entry on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!e.target.value.trim()) return;
    const now = Date.now();
    if (now - lastTypingSentAt.current < 3000) return;
    lastTypingSentAt.current = now;
    signalUserTyping(threadId);
  };

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6 animated-fade-in pb-10">

      {/* Page header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Feedback</h2>
        <p className="text-gray-500 mt-1">Envie sua opinião ou reporte problemas de forma anônima e segura.</p>
      </div>

      {/* Privacy badge */}
      <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
        <Shield className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-purple-800">Canal anônimo e criptografado</p>
          <p className="text-xs text-purple-600 mt-0.5">
            Sua identidade nunca é transmitida. As mensagens são criptografadas no seu navegador
            antes do envio — nem o servidor tem acesso ao conteúdo em texto claro.
          </p>
        </div>
      </div>

      {/* Chat window */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-20rem)] min-h-[420px]">

        {/* Chat header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Canal de Feedback</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-purple-600 font-medium">Criptografado · Anônimo</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => loadMessages()}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-purple-300" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">Nenhuma mensagem ainda</p>
                <p className="text-gray-400 text-sm mt-1">
                  Envie seu feedback — responderemos em breve.
                </p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Admin avatar */}
                {msg.sender === 'admin' && (
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mb-1">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.sender === 'admin' && (
                    <p className="text-xs font-semibold text-indigo-600 mb-1">Equipe MeuDin</p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-xs mt-1.5 ${msg.sender === 'user' ? 'text-purple-200 text-right' : 'text-gray-400'}`}>
                    {fmt(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}

          {adminTyping && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mb-1">
                <Shield className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-gray-100 text-gray-500 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite seu feedback… (Enter para enviar, Shift+Enter para nova linha)"
              rows={2}
              disabled={sending}
              className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-11 h-11 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              title="Enviar"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Lock className="w-3 h-3 shrink-0" />
            Sua identidade não é transmitida. A mensagem é criptografada no cliente antes do envio.
          </p>
        </div>
      </div>
    </div>
  );
};
