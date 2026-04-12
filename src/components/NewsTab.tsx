import React, { useState, useEffect } from 'react';
import { Bell, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

export const NewsTab: React.FC = () => {
  const [news, setNews] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications`);
        if (res.ok) {
          setNews(await res.json());
        }
      } catch (err) {
        console.error('Erro ao buscar novidades:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Notificações
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Acompanhe as últimas notificações do MeuDin</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Nenhuma notificação por enquanto</h3>
          <p className="text-gray-500 mt-2">Fique de olho, em breve teremos atualizações!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {news.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-rose-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
              
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {item.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(item.created_at)}
                </div>
              </div>
              
              <div className="prose prose-orange max-w-none prose-p:text-gray-600 prose-p:leading-relaxed">
                <p className="whitespace-pre-wrap">
                  {item.content.length > 250 && !expanded[item.id]
                    ? item.content.slice(0, 250) + '...'
                    : item.content}
                </p>
                {item.content.length > 250 && (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    {expanded[item.id] ? (
                      <>Mostrar menos <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Ler tudo <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
