import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/finance';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Wallet, TrendingDown, LineChart, ArrowUpRight, PiggyBank } from 'lucide-react';
import { ChartsSection } from './ChartsSection';

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, subValue }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {subValue && <p className="text-xs text-emerald-600 mt-1 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1"/>{subValue}</p>}
    </div>
    <div className={`p-3 rounded-xl ${bgClass}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
  </div>
);

export const Dashboard = () => {
  const { stats } = useFinance();

  return (
    <div className="space-y-8 animated-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Visão Geral</h2>
        <p className="text-gray-500 mt-1">Resumo das suas finanças este mês.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard
          title="Saldo Atual"
          value={formatCurrency(stats.balance)}
          icon={Wallet}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <StatCard
          title="Total Investido"
          value={formatCurrency(stats.investedTotal)}
          icon={LineChart}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
          subValue={`+${formatCurrency(stats.investmentYield)} rendendo`}
        />
        <StatCard
          title="Total Recebido"
          value={formatCurrency(stats.incomeTotal)}
          icon={TrendingUp}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          title="Total Pago"
          value={formatCurrency(stats.paidTotal)}
          icon={TrendingDown}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      {/* Bill Status Section - Moved Up */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Situação das Contas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Contas Pendentes"
            value={stats.pendingCount}
            icon={Clock}
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
          />
          <StatCard
            title="Contas Atrasadas"
            value={stats.overdueCount}
            icon={AlertCircle}
            colorClass="text-rose-600"
            bgClass="bg-rose-50"
          />
          <StatCard
            title="Contas Pagas"
            value={stats.paidCount}
            icon={CheckCircle}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
        </div>
      </div>

      {/* Investment Forecast Banner - Moved Down */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
         <div className="relative z-10 flex items-center justify-between">
            <div>
               <p className="text-purple-200 font-medium mb-1">Previsão Patrimônio em Investimentos</p>
               <h3 className="text-3xl font-bold">{formatCurrency(stats.investedTotal + stats.investmentYield)}</h3>
               <p className="text-xs text-purple-300 mt-2">Soma do valor aplicado + rendimento estimado no final do prazo.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <PiggyBank className="w-8 h-8 text-purple-100" />
            </div>
         </div>
      </div>
      
      {/* Charts Section - Remains at bottom */}
      <ChartsSection />
    </div>
  );
};
