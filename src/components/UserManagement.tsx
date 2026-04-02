import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, KeyRound, Trash2, X, Check, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface User {
  id: string;
  username: string;
  created_at: string;
  group_count: number;
}

interface Feedback {
  message: string;
  type: 'success' | 'error';
}

export const UserManagement: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // New user form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newLoading, setNewLoading] = useState(false);

  // Reset password
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/users`, { headers });
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: newUsername, password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(`Usuário "${newUsername}" criado com sucesso!`, 'success');
        setNewUsername('');
        setNewPassword('');
        setShowNewForm(false);
        fetchUsers();
      } else {
        showFeedback(data.error || 'Erro ao criar usuário', 'error');
      }
    } catch {
      showFeedback('Erro de conexão', 'error');
    } finally {
      setNewLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId) return;
    setResetLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/users/${resetUserId}/password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: resetPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('Senha redefinida com sucesso!', 'success');
        setResetUserId(null);
        setResetPassword('');
      } else {
        showFeedback(data.error || 'Erro ao redefinir senha', 'error');
      }
    } catch {
      showFeedback('Erro de conexão', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${user.username}"? Todos os dados serão perdidos.`)) return;
    try {
      const res = await fetch(`${API_URL}/auth/users/${user.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok) {
        showFeedback(`Usuário "${user.username}" excluído.`, 'success');
        fetchUsers();
      } else {
        showFeedback(data.error || 'Erro ao excluir usuário', 'error');
      }
    } catch {
      showFeedback('Erro de conexão', 'error');
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-6 animated-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Usuários</h2>
          <p className="text-gray-500 mt-1">Gerencie os usuários do sistema.</p>
        </div>
        <button
          onClick={() => { setShowNewForm(true); setResetUserId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {feedback.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {feedback.message}
        </div>
      )}

      {/* Formulário novo usuário */}
      {showNewForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Novo Usuário</h3>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nome de usuário"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha inicial"
              required
              minLength={4}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={newLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {newLoading ? 'Criando...' : 'Criar'}
            </button>
          </form>
        </div>
      )}

      {/* Formulário redefinir senha */}
      {resetUserId && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Redefinir senha — <span className="text-amber-600">{users.find(u => u.id === resetUserId)?.username}</span>
            </h3>
            <button onClick={() => { setResetUserId(null); setResetPassword(''); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleResetPassword} className="flex gap-3">
            <input
              type="password"
              placeholder="Nova senha"
              required
              minLength={4}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={resetLoading}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:opacity-50"
            >
              {resetLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          <span className="font-semibold text-gray-700">
            {loading ? 'Carregando...' : `${users.length} usuário${users.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum usuário encontrado.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(user => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                      {user.username}
                      {user.username === currentUser?.username && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">você</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      Criado em {formatDate(user.created_at)} · {user.group_count} carteira{Number(user.group_count) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setResetUserId(user.id); setResetPassword(''); setShowNewForm(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                    title="Redefinir senha"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Senha
                  </button>
                  {user.username !== currentUser?.username && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors"
                      title="Excluir usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
