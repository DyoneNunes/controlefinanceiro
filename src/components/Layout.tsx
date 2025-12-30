import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, LineChart, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10 transition-all">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Finances
          </h1>
        </div>

        <div className="px-6 pb-6 pt-2">
           <div className="bg-gray-50 rounded-xl p-3 flex items-center space-x-3 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500">
                  Online
                </p>
              </div>
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
          <NavLink to="/bills" className={({ isActive }) => clsx(
            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}>
            <Receipt className="w-5 h-5 mr-3" />
            Minhas Contas
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
