import React, { useState, useEffect } from 'react';
import { Lock, User, Plus, Pencil, Trash2, X, Check, AlertCircle, LogOut, Users, Shield, Mail, Send } from 'lucide-react';

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

        <div className="flex justify-end">
          <button onClick={() => { setShowNewForm(true); setEditUser(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm transition-colors">
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>

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
