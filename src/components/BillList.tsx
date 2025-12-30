import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { BillForm } from './BillForm';
import { formatCurrency } from '../utils/finance';
import { format, parseISO } from 'date-fns';
import { Trash2, Check, Plus } from 'lucide-react';
import clsx from 'clsx';
import type { BillStatus } from '../types';

export const BillList = () => {
  const { bills, markAsPaid, deleteBill } = useFinance();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState<BillStatus | 'all'>('all');

  const filteredBills = bills.filter(bill => {
    if (filter === 'all') return true;
    return bill.status === filter;
  });

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'overdue': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: BillStatus) => {
      switch (status) {
        case 'paid': return 'Pago';
        case 'overdue': return 'Atrasado';
        case 'pending': return 'Pendente';
      }
  };

  return (
    <div className="space-y-6 animated-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900">Minhas Contas</h2>
           <p className="text-gray-500 mt-1">Gerencie seus pagamentos.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Conta
        </button>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'overdue', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors",
              filter === f 
                ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            {f === 'all' ? 'Todas' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
             </div>
             <p className="text-lg font-medium text-gray-900">Nenhuma conta encontrada</p>
             <p className="text-sm">Tente mudar o filtro ou adicione uma nova conta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Vencimento</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{bill.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(parseISO(bill.dueDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(bill.value)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>
                        {getStatusLabel(bill.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bill.status !== 'paid' && (
                            <button
                            onClick={() => markAsPaid(bill.id)}
                            title="Marcar como Pago"
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                            <Check className="w-4 h-4" />
                            </button>
                        )}
                        
                        <button
                            onClick={() => deleteBill(bill.id)}
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

      {isFormOpen && <BillForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};
