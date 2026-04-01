import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useGroup } from '../context/GroupContext';
import { X, LineChart, DollarSign, Calendar, Wallet, FileText, Calculator, Percent, Clock } from 'lucide-react';
import { calculateInvestmentReturn } from '../utils/investment';
import { formatCurrency } from '../utils/finance';

interface InvestmentFormProps {
  onClose: () => void;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ onClose }) => {
  const { addInvestment } = useFinance();
  const { groups, currentGroup } = useGroup();
  const [formData, setFormData] = useState({
    name: '',
    initialAmount: '',
    cdiPercent: '100',
    startDate: '',
    durationMonths: ''
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(currentGroup?.id);

  useEffect(() => {
    setSelectedGroupId(currentGroup?.id);
  }, [currentGroup]);

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
    if (!formData.name || !formData.initialAmount || !formData.startDate || !formData.durationMonths || !selectedGroupId) return;

    addInvestment({
      name: formData.name,
      initialAmount: Number(formData.initialAmount),
      cdiPercent: Number(formData.cdiPercent),
      startDate: new Date(formData.startDate).toISOString(),
      durationMonths: Number(formData.durationMonths),
      groupId: selectedGroupId
    });
    onClose();
  };

  const estimatedTotal = previewReturn();
  const estimatedProfit = estimatedTotal > 0 ? estimatedTotal - Number(formData.initialAmount) : 0;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-6 sm:pt-12 md:pt-20 modal-overlay overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative modal-panel overflow-hidden max-h-[calc(100vh-3rem)] sm:max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-violet-500 shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
              <LineChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Novo Investimento</h2>
              <p className="text-sm text-gray-400">Registre um novo investimento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário (scrollável) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto border-t border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome / Descrição</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Ex: CDB Banco X, Tesouro Selic..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor Investido (R$)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="0,00"
                    value={formData.initialAmount}
                    onChange={e => setFormData({...formData, initialAmount: e.target.value})}
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">% do CDI</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="1"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="100"
                    value={formData.cdiPercent}
                    onChange={e => setFormData({...formData, cdiPercent: e.target.value})}
                  />
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data Início</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duração (Meses)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="12"
                    value={formData.durationMonths}
                    onChange={e => setFormData({...formData, durationMonths: e.target.value})}
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Carteira</label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-gray-900 appearance-none cursor-pointer"
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  disabled={groups.length === 0}
                >
                  <option value="">Selecione uma carteira</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              {groups.length === 0 && <p className="text-rose-500 text-xs mt-1.5 font-medium">Nenhuma carteira disponível.</p>}
            </div>

            {/* Preview de retorno */}
            {estimatedTotal > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center text-purple-700 font-semibold mb-2">
                  <Calculator className="w-4 h-4 mr-2" />
                  Estimativa de Retorno
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(estimatedTotal)}
                    </p>
                    <p className="text-sm text-emerald-600 font-medium mt-0.5">
                      +{formatCurrency(estimatedProfit)} de rendimento
                    </p>
                  </div>
                </div>
                <p className="text-xs text-purple-500 mt-2">
                  *Considerando CDI de 13.65% a.a. constante.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              disabled={groups.length === 0}
            >
              Adicionar Investimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
