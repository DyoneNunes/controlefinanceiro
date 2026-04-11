import { useState, useRef, useEffect } from 'react';
import { Upload, Check, X, AlertCircle, FileUp, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useFinance } from '../context/FinanceContext';

interface ImportedTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  category: 'incomes' | 'bills' | 'random_expenses' | 'investments';
  selected: boolean;
}

export const BankImport = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const { token } = useAuth();
  const { currentGroup } = useGroup();
  const { refreshData } = useFinance();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !currentGroup) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/ai/import/ofx`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Group-ID': currentGroup.id
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao processar arquivo');
      }

      const data = await response.json();
      
      const classified = data.transactions.map((tx: any) => ({
         ...tx,
         category: tx.category === 'income' ? 'incomes' : (tx.category === 'expense' ? 'random_expenses' : (tx.category || (tx.amount < 0 ? 'random_expenses' : 'incomes'))),
         selected: true
      }));

      setTransactions(classified);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    const updated = [...transactions];
    updated[index].selected = !updated[index].selected;
    setTransactions(updated);
  };

  const changeCategory = (index: number, newCat: 'incomes' | 'bills' | 'random_expenses' | 'investments') => {
    const updated = [...transactions];
    updated[index].category = newCat;
    setTransactions(updated);
  };

  const handleConfirmImport = async () => {
    if (!currentGroup) return;
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/ai/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Group-ID': currentGroup.id
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) throw new Error('Falha ao salvar transações');

      await refreshData();
      onClose();
      alert('Transações importadas com sucesso!');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = transactions.filter(t => t.selected).length;

  return (
    <div className="fixed inset-y-0 right-0 left-0 md:left-[var(--sidebar-offset)] bg-gray-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay overflow-y-auto transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[calc(100vh-3rem)] sm:max-h-[85vh] overflow-hidden flex flex-col modal-panel" onClick={e => e.stopPropagation()}>
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <FileUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Importar Extrato</h2>
              <p className="text-sm text-gray-400">OFX e PDF suportados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto border-t border-gray-100 p-6">

          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl mb-4 flex items-center gap-3 border border-rose-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 'upload' ? (
            <div
              className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".ofx,.qfx,.pdf"
              />
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-lg font-semibold text-gray-700">
                {file ? file.name : 'Clique para selecionar o arquivo'}
              </p>
              <p className="text-sm text-gray-400 mt-2">Suporta Nubank, Inter, Itaú, BB (OFX e PDF)</p>

              {file && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  disabled={loading}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4" />
                      Carregar Arquivo
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600 font-medium">Confirme as transações antes de importar.</p>
                <div className="text-sm font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 text-sm">
                      <th className="p-3 font-semibold">Importar</th>
                      <th className="p-3 font-semibold">Data</th>
                      <th className="p-3 font-semibold">Descrição</th>
                      <th className="p-3 font-semibold">Valor</th>
                      <th className="p-3 font-semibold">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {transactions.map((tx, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${!tx.selected ? 'opacity-40' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={tx.selected}
                            onChange={() => toggleSelect(idx)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono text-gray-600 text-xs">{tx.date}</td>
                        <td className="p-3 font-medium text-gray-800">{tx.description}</td>
                        <td className={`p-3 font-bold ${tx.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3">
                          <select
                            value={tx.category}
                            onChange={(e) => changeCategory(idx, e.target.value as any)}
                            className="bg-gray-50/80 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          >
                            <option value="incomes">Receitas</option>
                            <option value="bills">Contas Fixas</option>
                            <option value="random_expenses">Gastos Variáveis</option>
                            <option value="investments">Investimentos</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 shrink-0">
            <button
              onClick={() => { setStep('upload'); setFile(null); setTransactions([]); }}
              className="px-5 py-2.5 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-xl font-semibold transition-all"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={loading || selectedCount === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Importação
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
