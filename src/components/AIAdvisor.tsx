import { useState, useEffect } from 'react';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { useGroup, type Group } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AdvisorData {
  diagnostico: string;
  pontos_atencao: string[];
  estrategia: { titulo: string; detalhe: string }[];
  recomendacao_investimentos: string;
}

interface HistoricalAdviceSummary {
  id: string;
  generated_at: string;
  diagnostico_summary: string;
}

export const AIAdvisor = () => {
  useAuth(); // Just to ensure context is available
  const { currentGroup, loading: groupsLoading } = useGroup();
  const [advice, setAdvice] = useState<AdvisorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<HistoricalAdviceSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const generateAdvice = async () => {
    if (!currentGroup) {
      setError("Erro: Carteira principal não encontrada.");
      return;
    }

    setLoading(true);
    setError(null);
    setAdvice(null); 
    try {
      const token = localStorage.getItem('finance_token');
      const res = await fetch(`${API_URL}/advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Group-ID': currentGroup.id
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao comunicar com o servidor.');
      }

      const data = await res.json();
      let parsedAdvice = data.advice;
      if (typeof parsedAdvice === 'string') {
        try {
          parsedAdvice = JSON.parse(parsedAdvice);
        } catch (e) {
          throw new Error("O formato da resposta da IA não é válido.");
        }
      }
      setAdvice(parsedAdvice);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryList = async (group: Group) => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('finance_token');
      const res = await fetch(`${API_URL}/advisor/history`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Group-ID': group.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchHistoricalAdvice = async (id: string) => {
    if (!currentGroup) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('finance_token');
      const res = await fetch(`${API_URL}/advisor/history/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Group-ID': currentGroup.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdvice(data);
        setShowHistory(false); 
      }
    } catch (err: any) {
      setError('Erro ao carregar detalhes do histórico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory && currentGroup) {
      fetchHistoryList(currentGroup);
    }
  }, [showHistory, currentGroup]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (groupsLoading && !currentGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600 font-medium">Carregando Advisor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animated-fade-in pb-12">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">Consultor Financeiro IA</h2>
            <p className="text-indigo-100 text-lg max-w-2xl leading-relaxed opacity-90">
              Utilize nossa inteligência artificial para analisar suas finanças.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={generateAdvice}
                disabled={loading || showHistory || !currentGroup} 
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-50 hover:scale-[1.02] transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin text-indigo-600" />
                    <span className="text-indigo-600">Processando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3 text-indigo-500 group-hover:text-indigo-600" />
                    <span>Gerar Relatório</span>
                  </>
                )}
              </button>

              <button
                onClick={() => { setShowHistory(!showHistory); setAdvice(null); }}
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-50 hover:scale-[1.02] transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {showHistory ? 'Voltar' : 'Ver Histórico'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && !showHistory && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl text-red-700">
          <p className="font-bold">Aviso</p>
          <p>{error}</p>
        </div>
      )}

      {showHistory ? (
        <div className="space-y-6 animated-fade-in">
          <h3 className="text-3xl font-bold text-gray-800 text-center">Histórico</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : historyList.length === 0 ? (
            <p className="text-center text-gray-600 text-lg p-8">Nenhum histórico.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyList.map(item => (
                <li key={item.id} className="bg-white rounded-xl shadow-md p-6 cursor-pointer" onClick={() => fetchHistoricalAdvice(item.id)}>
                  <p className="text-sm text-gray-500">{formatDate(item.generated_at)}</p>
                  <p className="text-lg font-semibold line-clamp-2">{item.diagnostico_summary}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        advice && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Diagnóstico</h3>
              <p className="text-gray-700 leading-relaxed">{advice.diagnostico}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold mb-4 text-red-600">Atenção</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {advice.pontos_atencao.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold mb-4 text-green-600">Plano de Ação</h3>
                <div className="space-y-4">
                  {advice.estrategia.map((s, i) => (
                    <div key={i}>
                      <p className="font-bold">{s.titulo}</p>
                      <p className="text-sm text-gray-600">{s.detalhe}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Investimentos</h3>
              <p className="opacity-90">{advice.recomendacao_investimentos}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
};
