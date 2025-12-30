import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { InvestmentForm } from './InvestmentForm';
import { formatCurrency } from '../utils/finance';
import { calculateInvestmentReturn } from '../utils/investment';
import { format, parseISO, addMonths } from 'date-fns';
import { Trash2, Plus, TrendingUp, Calendar } from 'lucide-react';

export const InvestmentList = () => {
  const { investments, deleteInvestment } = useFinance();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6 animated-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900">Meus Investimentos</h2>
           <p className="text-gray-500 mt-1">Acompanhe a rentabilidade estimada das suas aplicações.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Investimento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments.map(inv => {
            const finalValue = calculateInvestmentReturn(inv.initialAmount, inv.cdiPercent, inv.durationMonths);
            const profit = finalValue - inv.initialAmount;
            const endDate = addMonths(parseISO(inv.startDate), inv.durationMonths);

            return (
                <div key={inv.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all relative group">
                    <button
                        onClick={() => deleteInvestment(inv.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir Investimento"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {inv.cdiPercent}% do CDI
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1">{inv.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" /> 
                        Até {format(endDate, 'dd/MM/yyyy')} ({inv.durationMonths} meses)
                    </p>

                    <div className="space-y-3 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Valor Investido</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(inv.initialAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Rendimento Estimado</span>
                            <span className="font-semibold text-emerald-600">+{formatCurrency(profit)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-medium text-gray-900">Total Final</span>
                            <span className="text-xl font-bold text-purple-600">{formatCurrency(finalValue)}</span>
                        </div>
                    </div>
                </div>
            );
        })}
        {investments.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                <p>Nenhum investimento registrado.</p>
            </div>
        )}
      </div>

      {isFormOpen && <InvestmentForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
};
