import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RandomExpenseForm } from './RandomExpenseForm';
import { formatCurrency } from '../utils/finance';
import { format, parseISO } from 'date-fns';
import { Trash2, Plus, Shuffle } from 'lucide-react';

export const RandomExpenseList = () => {
  const { randomExpenses, deleteRandomExpense } = useFinance();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6 animated-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900">Gastos Aleatórios</h2>
           <p className="text-gray-500 mt-1">Gerencie seus gastos diversos.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Gasto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {randomExpenses.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Shuffle className="w-8 h-8 text-gray-400" />
             </div>
             <p className="text-lg font-medium text-gray-900">Nenhum gasto encontrado</p>
             <p className="text-sm">Adicione um novo gasto para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Data</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {randomExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{expense.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(parseISO(expense.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(expense.value)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => deleteRandomExpense(expense.id)}
                            title="Excluir"
                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && <RandomExpenseForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};
