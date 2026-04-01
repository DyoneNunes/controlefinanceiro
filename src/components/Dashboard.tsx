import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/finance';
import { calculateInvestmentReturn } from '../utils/investment';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Wallet, TrendingDown, LineChart, ArrowUpRight, PiggyBank, Shuffle, ChevronLeft, ChevronRight, Calendar, Upload, DollarSign } from 'lucide-react';
import { ChartsSection } from './ChartsSection';
import { BankImport } from './BankImport';
import { format, addMonths, subMonths, isSameMonth, isSameYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, subValue, label }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {subValue && <p className="text-xs text-emerald-600 mt-1 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />{subValue}</p>}
      {label && <p className="text-xs text-gray-400 mt-2">{label}</p>}
    </div>
    <div className={`p-3 rounded-xl ${bgClass}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
  </div>
);

export const Dashboard = () => {
  const { bills, incomes, randomExpenses, investments } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showImport, setShowImport] = useState(false);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthlyStats = useMemo(() => {
    const isCurrentMonth = (dateStr: string) => isSameMonth(parseISO(dateStr), currentDate);

    const incomeTotal = incomes
      .filter(i => isCurrentMonth(i.date))
      .reduce((sum, i) => sum + Number(i.value), 0);

    const billsPaid = bills.filter(b => {
      if (b.status !== 'paid') return false;
      const effectiveDate = b.paidDate ? b.paidDate : b.dueDate;
      return isCurrentMonth(effectiveDate);
    });

    const billsPending = bills.filter(b =>
      b.status === 'pending' && isCurrentMonth(b.dueDate)
    );

    const billsOverdue = bills.filter(b => b.status === 'overdue');

    const paidTotal = billsPaid.reduce((sum, b) => sum + Number(b.value), 0);
    const pendingTotal = billsPending.reduce((sum, b) => sum + Number(b.value), 0);
    const overdueTotal = billsOverdue.reduce((sum, b) => sum + Number(b.value), 0);

    const randomTotal = randomExpenses
      .filter(r => isCurrentMonth(r.date))
      .reduce((sum, r) => sum + Number(r.value), 0);

    const investedTotal = investments
      .filter(i => isCurrentMonth(i.startDate))
      .reduce((sum, i) => sum + Number(i.initialAmount), 0);

    const totalCashOutflows = paidTotal + randomTotal;
    const balance = incomeTotal - totalCashOutflows;

    // Dinheiro livre = Receita - Todas as contas fixas do mês (pagas + pendentes + vencidas)
    const allBillsTotal = paidTotal + pendingTotal + overdueTotal;
    const dinheiroLivre = incomeTotal - allBillsTotal;

    return {
      incomeTotal,
      paidTotal,
      pendingTotal,
      overdueTotal,
      randomTotal,
      investedTotal,
      balance,
      dinheiroLivre,
      pendingCount: billsPending.length,
      overdueCount: billsOverdue.length,
      paidCount: billsPaid.length
    };
  }, [currentDate, bills, incomes, randomExpenses, investments]);

  const yearlyStats = useMemo(() => {
    const isCurrentYear = (dateStr: string) => isSameYear(parseISO(dateStr), currentDate);

    const incomeTotal = incomes
      .filter(i => isCurrentYear(i.date))
      .reduce((sum, i) => sum + Number(i.value), 0);

    const expenseTotal =
      bills.filter(b => isCurrentYear(b.dueDate) && b.status === 'paid').reduce((sum, b) => sum + Number(b.value), 0) +
      randomExpenses.filter(r => isCurrentYear(r.date)).reduce((sum, r) => sum + Number(r.value), 0);

    const investedTotal = investments
      .filter(i => isCurrentYear(i.startDate))
      .reduce((sum, i) => sum + Number(i.initialAmount), 0);

    return { incomeTotal, expenseTotal, investedTotal, balance: incomeTotal - expenseTotal - investedTotal };
  }, [currentDate, bills, incomes, randomExpenses, investments]);

  const totalAssets = useMemo(() => {
    const invested = investments.reduce((sum, i) => sum + Number(i.initialAmount), 0);
    const yieldVal = investments.reduce((sum, inv) => {
      const finalAmount = calculateInvestmentReturn(inv.initialAmount, inv.cdiPercent, inv.durationMonths);
      return sum + (finalAmount - Number(inv.initialAmount));
    }, 0);
    return { invested, yieldVal, total: invested + yieldVal };
  }, [investments]);

  return (
    <div className="space-y-8 animated-fade-in pb-10">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Visão Mensal</h2>
          <p className="text-gray-500 mt-1">Acompanhe suas finanças mensais.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar Extrato
          </button>

          <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-6 py-2 flex items-center font-bold text-gray-800 text-lg min-w-[200px] justify-center capitalize">
              <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo do Mês"
          value={formatCurrency(monthlyStats.balance)}
          icon={Wallet}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
          label="Receitas - Despesas já pagas"
        />
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(monthlyStats.incomeTotal)}
          icon={TrendingUp}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          title="Já Pago"
          value={formatCurrency(monthlyStats.paidTotal)}
          icon={TrendingDown}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
          label="Contas fixas já quitadas"
        />
        <StatCard
          title="Dinheiro Livre"
          value={formatCurrency(monthlyStats.dinheiroLivre)}
          icon={DollarSign}
          colorClass={monthlyStats.dinheiroLivre >= 0 ? "text-teal-600" : "text-red-600"}
          bgClass={monthlyStats.dinheiroLivre >= 0 ? "bg-teal-50" : "bg-red-50"}
          label="Receita - Todas as contas fixas"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Gastos Variáveis"
          value={formatCurrency(monthlyStats.randomTotal)}
          icon={Shuffle}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
        <StatCard
          title="Total a Pagar"
          value={formatCurrency(monthlyStats.pendingTotal + monthlyStats.overdueTotal)}
          icon={Clock}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
          subValue={monthlyStats.overdueTotal > 0 ? `${formatCurrency(monthlyStats.overdueTotal)} vencido` : undefined}
          label="Contas pendentes + atrasadas"
        />
        <StatCard
          title="Investido no Mês"
          value={formatCurrency(monthlyStats.investedTotal)}
          icon={LineChart}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-gray-500" />
          Resumo Anual ({format(currentDate, 'yyyy')})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-emerald-700 text-sm font-semibold">Total Ganho</p>
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(yearlyStats.incomeTotal)}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <p className="text-rose-700 text-sm font-semibold">Total Gasto</p>
            <p className="text-2xl font-bold text-rose-900">{formatCurrency(yearlyStats.expenseTotal)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-purple-700 text-sm font-semibold">Total Aportado</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(yearlyStats.investedTotal)}</p>
          </div>
          <div className={`rounded-xl p-4 border ${yearlyStats.balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`${yearlyStats.balance >= 0 ? 'text-blue-700' : 'text-red-700'} text-sm font-semibold`}>Balanço Anual</p>
            <p className={`text-2xl font-bold ${yearlyStats.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>{formatCurrency(yearlyStats.balance)}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Status das Contas (Mês)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Pendentes"
            value={monthlyStats.pendingCount}
            icon={Clock}
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
          />
          <StatCard
            title="Atrasadas"
            value={monthlyStats.overdueCount}
            icon={AlertCircle}
            colorClass="text-rose-600"
            bgClass="bg-rose-50"
          />
          <StatCard
            title="Pagas"
            value={monthlyStats.paidCount}
            icon={CheckCircle}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-purple-200 font-medium mb-1">Patrimônio Total Acumulado</p>
            <h3 className="text-3xl font-bold">{formatCurrency(totalAssets.total)}</h3>
            <p className="text-xs text-purple-300 mt-2">
              {formatCurrency(totalAssets.invested)} investidos + {formatCurrency(totalAssets.yieldVal)} rendimento
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <PiggyBank className="w-8 h-8 text-purple-100" />
          </div>
        </div>
      </div>

      <ChartsSection monthlyStats={monthlyStats} />

      {showImport && <BankImport onClose={() => setShowImport(false)} />}
    </div>
  );
};
