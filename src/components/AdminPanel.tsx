import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lock, User, Plus, Pencil, Trash2, X, Check, AlertCircle, LogOut, Users, Shield, Mail, Send, MessageSquare, ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchAllFeedbackMessages, sendAdminReply } from '../services/feedbackService';
import type { FeedbackMessage } from '../services/feedbackService';
import { decryptFeedback, encryptFeedback } from '../utils/feedbackCrypto';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const STORAGE_KEY = 'meudim_admin_token';

interface User {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
  group_count: number;
}

interface Feedback {
  message: string;
  type: 'success' | 'error';
}

// ---- LOGIN ----
const AdminLogin: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem(STORAGE_KEY, data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Senha incorreta');
      }
    } catch {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-600 to-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
          <p className="text-gray-400 mt-1 text-sm">MeuDin — Acesso restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-900/40 border border-rose-700 text-rose-300 text-sm rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              required
              placeholder="Usuário administrador"
              className="block w-full pl-10 px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="password"
              required
              placeholder="Senha"
              className="block w-full pl-10 px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Feedback helpers
// ─────────────────────────────────────────────────────────────────────────────

const SEEN_KEY = 'admin_fb_seen';

function getSeenIds(): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]')); }
  catch { return new Set(); }
}

function persistSeen(ids: string[]) {
  const seen = getSeenIds();
  ids.forEach(id => seen.add(id));
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

interface ThreadSummary {
  threadId: string;
  messages: FeedbackMessage[];
  unread: number;
  lastAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminFeedbackPanel
// ─────────────────────────────────────────────────────────────────────────────

const AdminFeedbackPanel: React.FC<{ onClose: () => void; onUnreadChange: (n: number) => void }> = ({ onClose, onUnreadChange }) => {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const msgs = await fetchAllFeedbackMessages();
    const seen = getSeenIds();

    // Decrypt all messages
    const dec: Record<string, string> = {};
    await Promise.all(msgs.map(async m => {
      try { dec[m.id] = await decryptFeedback({ ciphertext: m.ciphertext, iv: m.iv }, m.thread_id); }
      catch { dec[m.id] = '(mensagem cifrada)'; }
    }));
    setDecryptedMap(dec);

    // Group into threads
    const groups: Record<string, FeedbackMessage[]> = {};
    msgs.forEach(m => {
      if (!groups[m.thread_id]) groups[m.thread_id] = [];
      groups[m.thread_id].push(m);
    });

    const summaries: ThreadSummary[] = Object.entries(groups)
      .map(([tid, tmsgs]) => ({
        threadId: tid,
        messages: tmsgs,
        unread: tmsgs.filter(m => m.sender === 'user' && !seen.has(m.id)).length,
        lastAt: tmsgs[tmsgs.length - 1]?.created_at ?? '',
      }))
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

    setThreads(summaries);
    onUnreadChange(summaries.reduce((s, t) => s + t.unread, 0));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedId) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, threads]);

  const openThread = (threadId: string) => {
    setSelectedId(threadId);
    const t = threads.find(th => th.threadId === threadId);
    if (t) {
      const ids = t.messages.filter(m => m.sender === 'user').map(m => m.id);
      persistSeen(ids);
      setThreads(prev => prev.map(th => th.threadId === threadId ? { ...th, unread: 0 } : th));
      onUnreadChange(threads.filter(th => th.threadId !== threadId).reduce((s, th) => s + th.unread, 0));
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedId || sending) return;
    setSending(true);
    try {
      const enc = await encryptFeedback(replyText.trim(), selectedId);
      await sendAdminReply({ thread_id: selectedId, ciphertext: enc.ciphertext, iv: enc.iv });
      setReplyText('');
      await load();
    } finally { setSending(false); }
  };

  const fmtTime = (iso: string) => {
    try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const selectedThread = useMemo(() => threads.find(t => t.threadId === selectedId), [threads, selectedId]);

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedId ? (
            <button onClick={() => setSelectedId(null)} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : null}
          <MessageSquare className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-white">
            {selectedId ? (
              <span className="font-mono text-sm text-gray-300">{selectedId.slice(0, 16)}…</span>
            ) : 'Feedbacks'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!selectedId && (
            <button onClick={load} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Atualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            <X className="w-4 h-4" /> Fechar
          </button>
        </div>
      </div>

      {/* Thread list */}
      {!selectedId && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-700">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {loading ? 'Carregando…' : `${threads.length} thread${threads.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-violet-500" /></div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Nenhum feedback recebido ainda.</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {threads.map(t => (
                <button
                  key={t.threadId}
                  onClick={() => openThread(t.threadId)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-700/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-violet-900/50 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-violet-400" />
                      </div>
                      {t.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-gray-200 truncate">{t.threadId.slice(0, 12)}…</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {decryptedMap[t.messages[t.messages.length - 1]?.id] ?? '…'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{fmtTime(t.lastAt)}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{t.messages.length} msg{t.messages.length !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected thread messages */}
      {selectedId && selectedThread && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 flex flex-col overflow-hidden">
          <div className="flex-1 px-6 py-4 space-y-3 overflow-y-auto max-h-96">
            {selectedThread.messages.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Sem mensagens neste thread.</p>
            ) : (
              selectedThread.messages.map(m => (
                <div key={m.id} className={`flex items-end gap-2 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mb-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    m.sender === 'admin'
                      ? 'bg-violet-700 text-white rounded-br-sm'
                      : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                  }`}>
                    {m.sender === 'admin' && <p className="text-xs font-semibold text-violet-300 mb-1">Admin</p>}
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{decryptedMap[m.id] ?? '…'}</p>
                    <p className={`text-xs mt-1.5 ${m.sender === 'admin' ? 'text-violet-300 text-right' : 'text-gray-500'}`}>
                      {fmtTime(m.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          <div className="px-6 py-4 border-t border-gray-700">
            <div className="flex gap-3">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                placeholder="Responder… (Enter para enviar)"
                rows={2}
                disabled={sending}
                className="flex-1 resize-none bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-60"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="self-end w-11 h-11 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                {sending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- PAINEL ----
const AdminDashboard: React.FC<{ token: string; onLogout: () => void }> = ({ token, onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Novo usuário
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLoading, setNewLoading] = useState(false);

  // Editar usuário
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Enviar link de reset
  const [sendingResetId, setSendingResetId] = useState<string | null>(null);

  // Feedbacks
  const [showFeedbacks, setShowFeedbacks] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Poll unread feedback count every 12 seconds
  useEffect(() => {
    const check = async () => {
      const msgs = await fetchAllFeedbackMessages();
      const seen = getSeenIds();
      setUnreadCount(msgs.filter(m => m.sender === 'user' && !seen.has(m.id)).length);
    };
    check();
    const id = setInterval(check, 12_000);
    return () => clearInterval(id);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST', headers,
        body: JSON.stringify({ username: newUsername, password: newPassword, email: newEmail })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(`Usuário "${newUsername}" criado com sucesso!`, 'success');
        setNewUsername(''); setNewPassword(''); setNewEmail(''); setShowNewForm(false);
        fetchUsers();
      } else { showFeedback(data.error || 'Erro ao criar usuário', 'error'); }
    } catch { showFeedback('Erro de conexão', 'error'); }
    finally { setNewLoading(false); }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email || '');
    setShowNewForm(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${editUser.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ username: editUsername, email: editEmail })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('Usuário atualizado com sucesso!', 'success');
        setEditUser(null);
        fetchUsers();
      } else { showFeedback(data.error || 'Erro ao atualizar usuário', 'error'); }
    } catch { showFeedback('Erro de conexão', 'error'); }
    finally { setEditLoading(false); }
  };

  const handleSendReset = async (user: User) => {
    if (!user.email) {
      showFeedback(`"${user.username}" não tem e-mail cadastrado. Edite o usuário primeiro.`, 'error');
      return;
    }
    setSendingResetId(user.id);
    try {
      const res = await fetch(`${API_URL}/admin/users/${user.id}/send-reset`, { method: 'POST', headers });
      const data = await res.json();
      if (res.ok) { showFeedback(`Link de redefinição enviado para ${user.email}`, 'success'); }
      else { showFeedback(data.error || 'Erro ao enviar e-mail', 'error'); }
    } catch { showFeedback('Erro de conexão', 'error'); }
    finally { setSendingResetId(null); }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Excluir "${user.username}"? Todos os dados serão perdidos.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${user.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok) { showFeedback(`Usuário "${user.username}" excluído.`, 'success'); fetchUsers(); }
      else { showFeedback(data.error || 'Erro ao excluir', 'error'); }
    } catch { showFeedback('Erro de conexão', 'error'); }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Painel Admin</h1>
              <p className="text-gray-400 text-xs">MeuDin — Gerenciamento de usuários</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        {feedback && (
          <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700' : 'bg-rose-900/40 text-rose-300 border border-rose-700'}`}>
            {feedback.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {feedback.message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          {/* Feedbacks button with unread badge */}
          <button
            onClick={() => { setShowFeedbacks(v => !v); setShowNewForm(false); setEditUser(null); }}
            className="relative flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Feedbacks
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 min-w-[1.25rem] items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          <button onClick={() => { setShowNewForm(true); setEditUser(null); setShowFeedbacks(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm transition-colors">
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>

        {showFeedbacks && (
          <AdminFeedbackPanel
            onClose={() => setShowFeedbacks(false)}
            onUnreadChange={setUnreadCount}
          />
        )}

        {!showFeedbacks && <>
        {/* Form novo usuário */}
        {showNewForm && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Novo Usuário</h3>
              <button onClick={() => setShowNewForm(false)} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Nome de usuário" required
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                <input type="password" placeholder="Senha inicial" required minLength={4}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="email" placeholder="E-mail (opcional)"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <button type="submit" disabled={newLoading}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
                  {newLoading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Form editar usuário */}
        {editUser && (
          <div className="bg-gray-800 rounded-2xl border border-blue-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">
                Editar — <span className="text-blue-400">{editUser.username}</span>
              </h3>
              <button onClick={() => setEditUser(null)} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="Nome de usuário" required
                    className="w-full pl-9 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                </div>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" placeholder="E-mail"
                    className="w-full pl-9 px-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={editLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
                  {editLoading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-gray-300 text-sm">
              {loading ? 'Carregando...' : `${users.length} usuário${users.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum usuário.</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {users.map(user => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm flex-shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{user.username}</p>
                      {user.email
                        ? <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        : <p className="text-xs text-gray-600 italic">sem e-mail</p>
                      }
                      <p className="text-xs text-gray-500">
                        Criado em {formatDate(user.created_at)} · {user.group_count} carteira{Number(user.group_count) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-900/60 transition-colors"
                      title="Editar usuário"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleSendReset(user)}
                      disabled={sendingResetId === user.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/40 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-900/60 transition-colors disabled:opacity-50"
                      title={user.email ? 'Enviar link de redefinição de senha' : 'Usuário sem e-mail'}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendingResetId === user.id ? 'Enviando...' : 'Enviar link'}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/40 text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-900/60 transition-colors"
                      title="Excluir usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>}

      </div>
    </div>
  );
};

// ---- ENTRY POINT ----
export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));

  const handleLogin = (t: string) => setToken(t);

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
  };

  if (!token) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard token={token} onLogout={handleLogout} />;
};
