import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, MessageCircle } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const result = await login(username.trim(), password.trim());

    if (result) {
      navigate('/');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acesso ao Sistema</h1>
          <p className="text-gray-500 mt-2">Entre com suas credenciais para continuar.</p>
        </div>

        {!showRequestAccess ? (
          <>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl text-center font-medium animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Usuário</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowRequestAccess(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Não tem acesso? Solicite aqui
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-12 h-12 bg-amber-100 rounded-full mx-auto flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Solicitar Acesso</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Este sistema é de uso restrito. Para solicitar acesso, entre em contato com o administrador do sistema.
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-600 font-medium">
                Envie sua solicitação para:
              </p>
              <a href="mailto:dyone.andrade.l@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                dyone.andrade.l@gmail.com
              </a>
            </div>
            <button
              onClick={() => setShowRequestAccess(false)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              ← Voltar ao login
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; 2026 MeuDin. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};
