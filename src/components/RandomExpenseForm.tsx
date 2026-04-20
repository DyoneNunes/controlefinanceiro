import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useGroup } from '../context/GroupContext';
import { X, Shuffle, DollarSign, Calendar, Wallet, FileText, Pencil } from 'lucide-react';
import type { RandomExpense } from '../types';

interface RandomExpenseFormProps {
  onClose: () => void;
  expense?: RandomExpense;
}

export const RandomExpenseForm: React.FC<RandomExpenseFormProps> = ({ onClose, expense }) => {
  const { addRandomExpense, updateRandomExpense } = useFinance();
  const { groups, currentGroup } = useGroup();
  const isEditing = !!expense;

  const [formData, setFormData] = useState({
    name: expense?.name || '',
    value: expense?.value?.toString() || '',
    date: expense?.date ? expense.date.split('T')[0] : ''
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
    expense?.groupId || currentGroup?.id
  );

  useEffect(() => {
    if (!expense) setSelectedGroupId(currentGroup?.id);
  }, [currentGroup, expense]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value || !formData.date) return;

    if (isEditing && expense) {
      await updateRandomExpense(expense.id, {
        name: formData.name,
        value: Number(formData.value),
        date: new Date(formData.date).toISOString(),
      });
    } else {
      if (!selectedGroupId) return;
      await addRandomExpense({
        name: formData.name,
        value: Number(formData.value),
        date: new Date(formData.date).toISOString(),
        groupId: selectedGroupId
      });
    }
    onClose();
  };

  const accentColor = isEditing ? 'blue' : 'amber';

  return (
    <div className="fixed inset-y-0 right-0 left-0 md:left-[var(--sidebar-offset)] bg-gray-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay overflow-y-auto transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative modal-panel overflow-hidden max-h-[calc(100vh-3rem)] sm:max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Accent bar */}
        <div className={`h-1.5 ${isEditing ? 'bg-gradient-to-r from-blue-400 to-indigo-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'} shrink-0`} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isEditing ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'} border`}>
              {isEditing ? <Pencil className="w-5 h-5 text-blue-600" /> : <Shuffle className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isEditing ? 'Editar Gasto' : 'Novo Gasto Variavel'}</h2>
              <p className="text-sm text-gray-400">{isEditing ? 'Atualize as informacoes do gasto' : 'Registre um gasto avulso'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto border-t border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descricao</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-${accentColor}-500/20 focus:border-${accentColor}-500 outline-none transition-all text-gray-900 placeholder:text-gray-400`}
                  placeholder="Ex: Lanche, Uber, Farmacia..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-${accentColor}-500/20 focus:border-${accentColor}-500 outline-none transition-all text-gray-900 placeholder:text-gray-400`}
                    placeholder="0,00"
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: e.target.value})}
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-${accentColor}-500/20 focus:border-${accentColor}-500 outline-none transition-all text-gray-900`}
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Carteira</label>
                <div className="relative">
                  <select
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-gray-900 appearance-none cursor-pointer"
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
                {groups.length === 0 && <p className="text-rose-500 text-xs mt-1.5 font-medium">Nenhuma carteira disponivel.</p>}
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
              className={`flex-1 py-3 px-4 rounded-xl ${isEditing ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40' : 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'} text-white font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100`}
              disabled={!isEditing && groups.length === 0}
            >
              {isEditing ? 'Salvar Alteracoes' : 'Adicionar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
