import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useGroup } from '../context/GroupContext';
import { X, Receipt, DollarSign, Calendar, Wallet } from 'lucide-react';

interface BillFormProps {
  onClose: () => void;
}

export const BillForm: React.FC<BillFormProps> = ({ onClose }) => {
  const { addBill } = useFinance();
  const { groups, currentGroup } = useGroup();
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    dueDate: ''
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(currentGroup?.id);

  useEffect(() => {
    setSelectedGroupId(currentGroup?.id);
  }, [currentGroup]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value || !formData.dueDate || !selectedGroupId) return;

    addBill({
      name: formData.name,
      value: Number(formData.value),
      dueDate: new Date(formData.dueDate).toISOString(),
      groupId: selectedGroupId
    });
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 md:left-[var(--sidebar-offset)] bg-gray-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay overflow-y-auto transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative modal-panel overflow-hidden max-h-[calc(100vh-3rem)] sm:max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Nova Conta</h2>
              <p className="text-sm text-gray-400">Adicione uma conta fixa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto border-t border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome / Descrição</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="Ex: Aluguel, Luz, Internet..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor (R$)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="0,00"
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: e.target.value})}
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vencimento</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900"
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Carteira</label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 appearance-none cursor-pointer"
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
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              disabled={groups.length === 0}
            >
              Adicionar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
