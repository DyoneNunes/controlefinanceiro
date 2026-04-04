import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, LineChart, LogOut, User, Shuffle, Bot, Plus, UserPlus, Menu, X, ChevronDown, Check, PanelLeftClose, PanelLeftOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, activeClass: 'bg-blue-50 text-blue-700' },
  { to: '/advisor', label: 'Consultor IA', icon: Bot, activeClass: 'bg-indigo-50 text-indigo-700' },
  { to: '/bills', label: 'Contas Fixas', icon: Receipt, activeClass: 'bg-blue-50 text-blue-700' },
  { to: '/expenses', label: 'Gastos Variáveis', icon: Shuffle, activeClass: 'bg-amber-50 text-amber-700' },
  { to: '/incomes', label: 'Entradas', icon: TrendingUp, activeClass: 'bg-green-50 text-green-700' },
  { to: '/investments', label: 'Investimentos', icon: LineChart, activeClass: 'bg-purple-50 text-purple-700' },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare, activeClass: 'bg-violet-50 text-violet-700' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, user } = useAuth();
  const { currentGroup, createGroup, inviteUser, selectGroup, loading: groupLoading, groups } = useGroup();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(e.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateGroup = async () => {
    const name = window.prompt("Nome da nova carteira:");
    if (name) {
      try {
        await createGroup(name);
      } catch (e: any) {
        alert('Erro ao criar carteira: ' + e.message);
      }
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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          MeuDin
        </h1>
      </div>

      <div className="px-6 pb-2 relative" ref={walletDropdownRef}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Carteira</p>
          <button
            onClick={() => groups.length > 0 && setIsWalletDropdownOpen(!isWalletDropdownOpen)}
            className={clsx(
              "w-full flex items-center justify-between text-sm font-bold text-gray-700 truncate rounded-lg px-3 py-2 transition-colors",
              groups.length > 0 ? "hover:bg-gray-100 cursor-pointer" : "cursor-default"
            )}
          >
            <span className="truncate">
              {groupLoading ? 'Carregando...' : currentGroup?.name || (groups.length === 0 ? 'Nenhuma carteira' : 'Selecione uma carteira')}
            </span>
            {groups.length > 1 && <ChevronDown className={clsx("w-4 h-4 ml-1 text-gray-400 transition-transform", isWalletDropdownOpen && "rotate-180")} />}
          </button>
          {isWalletDropdownOpen && groups.length > 0 && (
            <div className="absolute left-6 right-6 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => { selectGroup(group.id); setIsWalletDropdownOpen(false); }}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                    currentGroup?.id === group.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span className="truncate">{group.name}</span>
                  {currentGroup?.id === group.id && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
      </div>

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
                {currentGroup?.role === 'admin' ? 'Administrador' : currentGroup?.role === 'editor' ? 'Editor' : 'Visualizador'}
              </p>
            </div>
         </div>

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
        {navItems.map(({ to, label, icon: Icon, activeClass }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeMobileMenu}
            className={({ isActive }) => clsx(
              "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
              isActive ? activeClass : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-5 h-5 mr-3" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => { handleLogout(); closeMobileMenu(); }}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair do Sistema
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className={clsx(
        "bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10 transition-all duration-300 overflow-y-auto",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        {isSidebarCollapsed ? (
          <div className="flex flex-col items-center py-4 space-y-4 h-full">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Expandir menu"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
            <nav className="flex-1 flex flex-col items-center space-y-2 pt-4">
              {navItems.map(({ to, icon: Icon, activeClass, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  title={label}
                  className={({ isActive }) => clsx(
                    "p-3 rounded-lg transition-colors",
                    isActive ? activeClass : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => { handleLogout(); }}
              className="p-3 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sair do Sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="absolute top-4 right-2 z-20">
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                title="Recolher menu"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          MeuDin
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20" onClick={closeMobileMenu}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside
            className="absolute top-0 left-0 w-72 h-full bg-white flex flex-col shadow-xl pt-16 overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className={clsx("flex-1 p-4 md:p-8 min-h-screen pt-16 md:pt-8 transition-all duration-300", isSidebarCollapsed ? "md:ml-16" : "md:ml-64")}>
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
