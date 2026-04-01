import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';

const GroupManager: React.FC = () => {
  const { groups, currentGroup, selectGroup, createGroup, updateGroup, deleteGroup, inviteUser, loading } = useGroup();
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setFeedback({ message: 'O nome da carteira não pode estar vazio.', type: 'error' });
      return;
    }
    try {
      await createGroup(newGroupName);
      setNewGroupName('');
      setFeedback({ message: 'Carteira criada com sucesso!', type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Erro ao criar carteira.', type: 'error' });
    }
  };

  const handleUpdateGroup = async (groupId: string) => {
    if (!editingGroupName.trim()) {
      setFeedback({ message: 'O nome da carteira não pode estar vazio.', type: 'error' });
      return;
    }
    try {
      await updateGroup(groupId, editingGroupName);
      setEditingGroupId(null);
      setEditingGroupName('');
      setFeedback({ message: 'Carteira atualizada com sucesso!', type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Erro ao atualizar carteira.', type: 'error' });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta carteira? Esta ação não pode ser desfeita e todos os dados serão perdidos.')) return;
    try {
      await deleteGroup(groupId);
      setFeedback({ message: 'Carteira excluída com sucesso!', type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Erro ao excluir carteira.', type: 'error' });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteUsername.trim()) {
      setFeedback({ message: 'Nome de usuário não pode estar vazio.', type: 'error' });
      return;
    }
    try {
      await inviteUser(inviteUsername);
      setInviteUsername('');
      setFeedback({ message: `Usuário ${inviteUsername} convidado com sucesso!`, type: 'success' });
    } catch (error: any) {
      setFeedback({ message: error.message || 'Erro ao convidar usuário.', type: 'error' });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
  };

  return (
    <div className="space-y-6 animated-fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gerenciar Carteiras</h2>
        <p className="text-gray-500 mt-1">Crie, edite e compartilhe suas carteiras financeiras.</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
          {feedback.message}
        </div>
      )}

      {/* Criar nova carteira */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Nova Carteira</h3>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Nome da carteira"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleCreateGroup}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            Criar
          </button>
        </div>
      </div>

      {/* Lista de carteiras */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Suas Carteiras</h3>
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-500">Nenhuma carteira encontrada. Crie uma acima!</p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.id} className={`p-4 rounded-xl border transition-colors ${currentGroup?.id === group.id ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                {editingGroupId === group.id ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateGroup(group.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">Salvar</button>
                      <button onClick={() => setEditingGroupId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 font-medium">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{group.name}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel(group.role)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selectGroup(group.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${currentGroup?.id === group.id ? 'bg-blue-600 text-white cursor-default' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        disabled={currentGroup?.id === group.id}
                      >
                        {currentGroup?.id === group.id ? 'Ativa' : 'Selecionar'}
                      </button>
                      {group.role === 'admin' && (
                        <>
                          <button onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }} className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors">Editar</button>
                          <button onClick={() => handleDeleteGroup(group.id)} className="px-4 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-200 transition-colors">Excluir</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Convidar usuário */}
      {currentGroup && currentGroup.role === 'admin' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Convidar para "{currentGroup.name}"</h3>
          <p className="text-sm text-gray-500 mb-4">O usuário convidado terá acesso como Editor.</p>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Nome de usuário"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleInviteUser}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              disabled={loading}
            >
              Convidar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManager;
