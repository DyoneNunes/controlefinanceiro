import { useState } from 'react';
import { Bot, Sparkles, AlertCircle, Loader2, CheckCircle2, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { useGroup } from '../context/GroupContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AdvisorData {
  diagnostico: string;
  pontos_atencao: string[];
  estrategia: { titulo: string; detalhe: string }[];
  recomendacao_investimentos: string;
}

export const AIAdvisor = () => {
  const { currentGroup } = useGroup();
  const [advice, setAdvice] = useState<AdvisorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAdvice = async () => {
    if (!currentGroup) {
      setError("Por favor, selecione uma carteira primeiro.");
      return;
    }
    setLoading(true);
    setError(null);
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
        throw new Error('Falha ao comunicar com o servidor.');
      }

      const data = await res.json();
      
      // Handle case where advice is a JSON string inside the JSON object
      let parsedAdvice = data.advice;
      if (typeof parsedAdvice === 'string') {
          try {
             parsedAdvice = JSON.parse(parsedAdvice);
          } catch (e) {
             // If parsing fails, it might be plain text (fallback)
             console.error("Failed to parse advice JSON", e);
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animated-fade-in pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">Consultor Financeiro IA</h2>
            <p className="text-indigo-100 text-lg max-w-2xl leading-relaxed opacity-90">
              Utilize nossa inteligência artificial para analisar profundamente suas contas e receber um plano de ação estratégico personalizado.
            </p>
            
            <div className="mt-8">
                <button
                onClick={generateAdvice}
                disabled={loading}
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-50 hover:scale-[1.02] transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                {loading ? (
                    <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin text-indigo-600" />
                    <span className="text-indigo-600">Processando Análise...</span>
                    </>
                ) : (
                    <>
                    <Sparkles className="w-6 h-6 mr-3 text-indigo-500 group-hover:text-indigo-600" />
                    <span>Gerar Relatório Completo</span>
                    </>
                )}
                </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl flex items-start text-red-700 shadow-sm animate-fade-in">
          <AlertCircle className="w-6 h-6 mr-4 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-lg">Erro na Análise</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {advice && (
        <div className="space-y-8 animate-fade-in">
          {/* Section 1: Diagnosis */}
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 p-8 transform hover:scale-[1.01] transition-transform duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Diagnóstico Financeiro</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/50 rounded-r-lg">
              {advice.diagnostico}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Section 2: Attention Points */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-50 p-8 flex flex-col h-full">
               <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Pontos de Atenção</h3>
               </div>
               <ul className="space-y-4 flex-1">
                 {advice.pontos_atencao.map((point, idx) => (
                   <li key={idx} className="flex items-start bg-red-50/50 p-4 rounded-xl border border-red-100">
                     <div className="mt-1 min-w-[20px]">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                     </div>
                     <span className="text-gray-700 font-medium ml-3">{point}</span>
                   </li>
                 ))}
               </ul>
            </div>

            {/* Section 3: Strategy */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-50 p-8 flex flex-col h-full">
               <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Plano de Ação</h3>
               </div>
               <div className="space-y-4 flex-1">
                 {advice.estrategia.map((step, idx) => (
                   <div key={idx} className="group p-4 bg-gray-50 hover:bg-green-50 rounded-xl transition-colors border border-gray-100 hover:border-green-200">
                     <div className="flex items-center mb-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full mr-3">
                            {idx + 1}
                        </span>
                        <h4 className="font-bold text-gray-900 group-hover:text-green-800">{step.titulo}</h4>
                     </div>
                     <p className="text-gray-600 text-sm pl-9 group-hover:text-green-700">{step.detalhe}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Section 4: Investments */}
          <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Recomendação de Investimentos</h3>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                    <p className="text-indigo-100 text-lg leading-relaxed">
                        {advice.recomendacao_investimentos}
                    </p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};