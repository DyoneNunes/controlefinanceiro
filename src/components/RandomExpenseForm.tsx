import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useGroup } from '../context/GroupContext'; // Import useGroup
import { X } from 'lucide-react';

interface RandomExpenseFormProps {
  onClose: () => void;
}

export const RandomExpenseForm: React.FC<RandomExpenseFormProps> = ({ onClose }) => {
  const { addRandomExpense } = useFinance();
  const { groups, currentGroup } = useGroup(); // Use useGroup
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    date: ''
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(currentGroup?.id); // State for selected group

  useEffect(() => {
    // Update selectedGroupId if currentGroup changes
    setSelectedGroupId(currentGroup?.id);
  }, [currentGroup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value || !formData.date || !selectedGroupId) return; // Ensure group is selected

    addRandomExpense({
      name: formData.name,
      value: Number(formData.value),
      date: new Date(formData.date).toISOString(),
      groupId: selectedGroupId // Pass selected group ID
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900">Novo Gasto Aleatório</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ex: Lanche"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="0,00"
              value={formData.value}
              onChange={e => setFormData({...formData, value: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
            <select
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              disabled={groups.length === 0}
            >
              <option value="">Selecione um grupo</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            {groups.length === 0 && <p className="text-red-500 text-xs mt-1">Nenhum grupo disponível. Crie um grupo primeiro.</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors mt-4"
            disabled={groups.length === 0}
          >
            Adicionar Gasto
          </button>
        </form>
      </div>
    </div>
  );
};
