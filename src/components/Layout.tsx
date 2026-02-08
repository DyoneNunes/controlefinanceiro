import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, LineChart, LogOut, User, Shuffle, Bot, Users, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import clsx from 'clsx';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, user } = useAuth();
  const { groups, currentGroup, selectGroup, createGroup, inviteUser } = useGroup();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateGroup = async () => {
    const name = window.prompt("Nome do novo grupo:");
    if (name) {
      await createGroup(name);
    }
  };

  const handleInvite = async () => {
    const username = window.prompt("Digite o nome de usuário para convidar:");
    if (username) {
      try {
        await inviteUser(username);
        alert('Convite enviado com sucesso!');
      } catch (e: any) {
        alert('Erro ao convidar: ' + e.message);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10 transition-all overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Finances
          </h1>
        </div>

        {/* GROUP SELECTOR - Only show if more than 1 group exists */}
        {groups.length > 1 ? (
          <div className="px-6 pb-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Carteira Ativa</label>
            <div className="relative">
              <select 
                  value={currentGroup?.id || ''} 
                  onChange={(e) => selectGroup(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm font-medium"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <Users className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-2">
             <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Finanças</p>
             <p className="text-sm font-bold text-gray-700 truncate">{currentGroup?.name || 'Pessoal'}</p>
          </div>
        )}

        <div className="px-6 pb-6 pt-4">
           <div className="bg-gray-50 rounded-xl p-3 flex items-center space-x-3 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentGroup?.role === 'admin' ? 'Administrador' : 'Membro'}
                </p>
              </div>
           </div>
           
           {/* Actions moved here to be less intrusive */}
           <div className="flex gap-2 mt-3">
              <button onClick={handleCreateGroup} className="flex-1 flex items-center justify-center py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[10px] font-semibold transition-colors">
                <Plus className="w-3 h-3 mr-1" /> Nova Carteira
              </button>
              {currentGroup?.role === 'admin' && (
                <button onClick={handleInvite} className="flex-1 flex items-center justify-center py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[10px] font-semibold transition-colors">
                  <UserPlus className="w-3 h-3 mr-1" /> Compartilhar
                </button>
              )}
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavLink to="/" className={({ isActive }) => clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}>
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </NavLink>
          <NavLink to="/advisor" className={({ isActive }) => clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}>
            <Bot className="w-5 h-5 mr-3" />
            Consultor IA
          </NavLink>
          <NavLink to="/bills" className={({ isActive }) => clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}>
            <Receipt className="w-5 h-5 mr-3" />
            Contas Fixas
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}>
            <Shuffle className="w-5 h-5 mr-3" />
            Gastos Variáveis
          </NavLink>
          <NavLink to="/incomes" className={({ isActive }) => clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}>
            <TrendingUp className="w-5 h-5 mr-3" />
            Entradas
          </NavLink>
          <NavLink to="/investments" className={({ isActive }) => clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}>
            <LineChart className="w-5 h-5 mr-3" />
            Investimentos
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
