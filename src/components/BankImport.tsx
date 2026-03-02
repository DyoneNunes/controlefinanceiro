import { useState, useRef } from 'react';
import { Upload, FileText, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useFinance } from '../context/FinanceContext';

interface ImportedTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  category: 'income' | 'expense';
  selected: boolean;
}

export const BankImport = ({ onClose }: { onClose: () => void }) => {
  const { token } = useAuth();
  const { currentGroup } = useGroup();
  const { refreshData } = useFinance(); // We need to refresh data after import
  
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
      const response = await fetch(`${API_URL}/import/ofx`, {
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
      
      // Auto-classify based on type
      const classified = data.transactions.map((tx: any) => ({
         ...tx,
         category: tx.category ? tx.category : (tx.amount < 0 ? 'expense' : 'income'),
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

  const changeCategory = (index: number, newCat: 'income' | 'expense') => {
    const updated = [...transactions];
    updated[index].category = newCat;
    setTransactions(updated);
  };

  const handleConfirmImport = async () => {
    if (!currentGroup) return;
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Group-ID': currentGroup.id
        },
        body: JSON.stringify({ transactions })
      });

      if (!response.ok) throw new Error('Falha ao salvar transações');

      // Success
      await refreshData();
      onClose();
      alert('Transações importadas com sucesso!');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Importar Extrato Bancário (OFX)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {step === 'upload' ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".ofx,.qfx,.pdf" 
              />
              <Upload className="w-12 h-12 text-indigo-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">
                {file ? file.name : 'Clique para selecionar o arquivo OFX ou PDF'}
              </p>
              <p className="text-sm text-gray-400 mt-2">Suporta Nubank, Inter, Itaú, BB (OFX e PDF)</p>
              
              {file && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                  disabled={loading}
                  className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Carregar Arquivo'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">Confirme as transações antes de importar.</p>
                <div className="text-sm text-gray-500">
                  {transactions.filter(t => t.selected).length} selecionados
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm">
                      <th className="p-3 rounded-tl-lg">Importar</th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3 rounded-tr-lg">Categoria</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {transactions.map((tx, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 ${!tx.selected ? 'opacity-50' : ''}`}>
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            checked={tx.selected} 
                            onChange={() => toggleSelect(idx)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-3 font-mono text-gray-600">{tx.date}</td>
                        <td className="p-3 font-medium text-gray-800">{tx.description}</td>
                        <td className={`p-3 font-bold ${tx.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3">
                          <select 
                            value={tx.category}
                            onChange={(e) => changeCategory(idx, e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs"
                          >
                            <option value="income">Receita</option>
                            <option value="expense">Despesa</option>
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
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            <button onClick={() => setStep('upload')} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">
              Voltar
            </button>
            <button 
              onClick={handleConfirmImport}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Salvando...' : 'Confirmar Importação'}
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
