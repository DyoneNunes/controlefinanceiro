import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Calculator } from 'lucide-react';
import { calculateInvestmentReturn } from '../utils/investment';
import { formatCurrency } from '../utils/finance';

interface InvestmentFormProps {
  onClose: () => void;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ onClose }) => {
  const { addInvestment } = useFinance();
  const [formData, setFormData] = useState({
    name: '',
    initialAmount: '',
    cdiPercent: '100',
    startDate: '',
    durationMonths: ''
  });

  // Calculate preview
  const previewReturn = () => {
    if (!formData.initialAmount || !formData.cdiPercent || !formData.durationMonths) return 0;
    return calculateInvestmentReturn(
      Number(formData.initialAmount), 
      Number(formData.cdiPercent), 
      Number(formData.durationMonths)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.initialAmount || !formData.startDate || !formData.durationMonths) return;

    addInvestment({
      name: formData.name,
      initialAmount: Number(formData.initialAmount),
      cdiPercent: Number(formData.cdiPercent),
      startDate: new Date(formData.startDate).toISOString(),
      durationMonths: Number(formData.durationMonths)
    });
    onClose();
  };

  const estimatedTotal = previewReturn();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Novo Investimento</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Descrição</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Ex: CDB Banco X"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Investido (R$)</label>
                <input
                type="number"
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="0,00"
                value={formData.initialAmount}
                onChange={e => setFormData({...formData, initialAmount: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">% do CDI</label>
                <input
                type="number"
                required
                step="1"
                min="0"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="100"
                value={formData.cdiPercent}
                onChange={e => setFormData({...formData, cdiPercent: e.target.value})}
                />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                <input
                type="date"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (Meses)</label>
                <input
                type="number"
                required
                min="1"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="12"
                value={formData.durationMonths}
                onChange={e => setFormData({...formData, durationMonths: e.target.value})}
                />
            </div>
          </div>

          {estimatedTotal > 0 && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-2">
                  <div className="flex items-center text-purple-800 font-medium mb-1">
                      <Calculator className="w-4 h-4 mr-2" />
                      Estimativa de Retorno
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(estimatedTotal)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                      *Considerando CDI de 13.65% a.a. constante.
                  </p>
              </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            Adicionar Investimento
          </button>
        </form>
      </div>
    </div>
  );
};
