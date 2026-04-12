import { useEffect } from 'react';
import { X, Wallet, TrendingUp, TrendingDown, DollarSign, Shuffle, Clock, LineChart, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/finance';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ModalType =
  | 'balance'
  | 'income'
  | 'paid'
  | 'freeMoney'
  | 'variable'
  | 'topay'
  | 'invested'
  | 'pending'
  | 'overdue'
  | 'paidCount';

export interface MonthlyModalData {
  incomeTotal: number;
  paidTotal: number;
  pendingTotal: number;
  overdueTotal: number;
  randomTotal: number;
  investedTotal: number;
  balance: number;
  dinheiroLivre: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  incomeItems: any[];
  paidBills: any[];
  pendingBills: any[];
  overdueBills: any[];
  randomItems: any[];
  investmentItems: any[];
}

interface DashboardCardModalProps {
  type: ModalType;
  onClose: () => void;
  monthlyStats: MonthlyModalData;
}

const config: Record<ModalType, {
  title: string;
  description: string;
  Icon: any;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  balance: {
    title: 'Saldo do Mês',
    description: 'Visão geral das suas finanças mensais',
    Icon: Wallet,
    iconBg: 'bg-indigo-50',
    iconBorder: 'border-indigo-100',
    iconColor: 'text-indigo-600',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-purple-500',
  },
  income: {
    title: 'Receita Mensal',
    description: 'Todas as entradas do mês',
    Icon: TrendingUp,
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-100',
    iconColor: 'text-emerald-600',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
  },
  paid: {
    title: 'Contas Pagas',
    description: 'Contas fixas quitadas neste mês',
    Icon: TrendingDown,
    iconBg: 'bg-rose-50',
    iconBorder: 'border-rose-100',
    iconColor: 'text-rose-600',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
  },
  freeMoney: {
    title: 'Dinheiro Livre',
    description: 'Receita menos todas as contas fixas e variáveis',
    Icon: DollarSign,
    iconBg: 'bg-teal-50',
    iconBorder: 'border-teal-100',
    iconColor: 'text-teal-600',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-cyan-500',
  },
  variable: {
    title: 'Gastos Variáveis',
    description: 'Despesas variáveis do mês',
    Icon: Shuffle,
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100',
    iconColor: 'text-amber-600',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
  },
  topay: {
    title: 'Total a Pagar',
    description: 'Contas pendentes e atrasadas',
    Icon: Clock,
    iconBg: 'bg-orange-50',
    iconBorder: 'border-orange-100',
    iconColor: 'text-orange-600',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-500',
  },
  invested: {
    title: 'Investido no Mês',
    description: 'Aportes realizados neste mês',
    Icon: LineChart,
    iconBg: 'bg-purple-50',
    iconBorder: 'border-purple-100',
    iconColor: 'text-purple-600',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-500',
  },
  pending: {
    title: 'Contas Pendentes',
    description: 'Contas aguardando pagamento',
    Icon: Clock,
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100',
    iconColor: 'text-amber-600',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500',
  },
  overdue: {
    title: 'Contas Atrasadas',
    description: 'Contas vencidas não pagas',
    Icon: AlertCircle,
    iconBg: 'bg-rose-50',
    iconBorder: 'border-rose-100',
    iconColor: 'text-rose-600',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-red-500',
  },
  paidCount: {
    title: 'Contas Pagas',
    description: 'Contas quitadas neste mês',
    Icon: CheckCircle,
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-100',
    iconColor: 'text-blue-600',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-500',
  },
};

const fmtDate = (dateStr: string) => {
  try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR }); } catch { return '—'; }
};

const ItemRow = ({ name, sub, value, valueColor }: { name: string; sub?: string; value: number; valueColor?: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div className="flex-1 min-w-0 pr-4">
      <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    <span className={`text-sm font-semibold shrink-0 ${valueColor || 'text-gray-700'}`}>
      {formatCurrency(value)}
    </span>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-8 text-gray-400">
    <p className="text-sm">{message}</p>
  </div>
);

const CalcRow = ({ sign, label, value, valueColor, border }: { sign: string; label: string; value: number; valueColor?: string; border?: boolean }) => (
  <div className={`flex justify-between items-center text-sm ${border ? 'border-t border-gray-200 pt-2 mt-2' : ''}`}>
    <span className="text-gray-600 flex items-center gap-1.5">
      <span className="w-4 text-center font-bold text-gray-400">{sign}</span>
      {label}
    </span>
    <span className={`font-medium ${valueColor || 'text-gray-700'}`}>{formatCurrency(value)}</span>
  </div>
);

function renderContent(type: ModalType, s: MonthlyModalData) {
  switch (type) {
    case 'balance':
      return (
        <div className="space-y-5">
          {/* Overview grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs font-medium text-emerald-600">Receita</p>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{formatCurrency(s.incomeTotal)}</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <p className="text-xs font-medium text-rose-600">Contas Pagas</p>
              <p className="text-xl font-bold text-rose-800 mt-0.5">{formatCurrency(s.paidTotal)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs font-medium text-amber-600">Gastos Variáveis</p>
              <p className="text-xl font-bold text-amber-800 mt-0.5">{formatCurrency(s.randomTotal)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs font-medium text-orange-600">A Pagar</p>
              <p className="text-xl font-bold text-orange-800 mt-0.5">{formatCurrency(s.pendingTotal + s.overdueTotal)}</p>
            </div>
          </div>

          {/* Calculation */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cálculo do Saldo</p>
            <CalcRow sign="+" label="Receita" value={s.incomeTotal} valueColor="text-emerald-700" />
            <CalcRow sign="−" label="Contas Pagas" value={s.paidTotal} valueColor="text-rose-600" />
            <CalcRow sign="−" label="Gastos Variáveis" value={s.randomTotal} valueColor="text-amber-600" />
            <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <span className="w-4 text-center font-bold text-gray-400">=</span>
                Saldo do Mês
              </span>
              <span className={`font-bold text-lg ${s.balance >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                {formatCurrency(s.balance)}
              </span>
            </div>
          </div>

          {/* Bill status counters */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-blue-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-700">{s.paidCount}</p>
              <p className="text-xs text-blue-600 mt-0.5">Pagas</p>
            </div>
            <div className="text-center bg-amber-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-700">{s.pendingCount}</p>
              <p className="text-xs text-amber-600 mt-0.5">Pendentes</p>
            </div>
            <div className="text-center bg-rose-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-rose-700">{s.overdueCount}</p>
              <p className="text-xs text-rose-600 mt-0.5">Atrasadas</p>
            </div>
          </div>

          {s.investedTotal > 0 && (
            <div className="bg-purple-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm font-medium text-purple-700">Investido no Mês</span>
              <span className="font-bold text-purple-800">{formatCurrency(s.investedTotal)}</span>
            </div>
          )}
        </div>
      );

    case 'income':
      return (
        <div className="space-y-3">
          <div className="bg-emerald-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-emerald-700">{s.incomeItems.length} entrada(s)</span>
            <span className="font-bold text-emerald-800">{formatCurrency(s.incomeTotal)}</span>
          </div>
          <div>
            {s.incomeItems.length === 0
              ? <EmptyState message="Nenhuma receita neste mês" />
              : s.incomeItems.map((item: any) => (
                  <ItemRow key={item.id} name={item.description} sub={fmtDate(item.date)} value={Number(item.value)} valueColor="text-emerald-700" />
                ))}
          </div>
        </div>
      );

    case 'paid':
    case 'paidCount':
      return (
        <div className="space-y-3">
          <div className={`rounded-xl p-3 flex justify-between items-center ${type === 'paidCount' ? 'bg-blue-50' : 'bg-rose-50'}`}>
            <span className={`text-sm font-semibold ${type === 'paidCount' ? 'text-blue-700' : 'text-rose-700'}`}>
              {s.paidBills.length} conta(s) paga(s)
            </span>
            <span className={`font-bold ${type === 'paidCount' ? 'text-blue-800' : 'text-rose-800'}`}>
              {formatCurrency(s.paidTotal)}
            </span>
          </div>
          <div>
            {s.paidBills.length === 0
              ? <EmptyState message="Nenhuma conta paga neste mês" />
              : s.paidBills.map((bill: any) => (
                  <ItemRow
                    key={bill.id}
                    name={bill.name}
                    sub={`Pago em ${fmtDate(bill.paidDate || bill.dueDate)}`}
                    value={Number(bill.value)}
                    valueColor={type === 'paidCount' ? 'text-blue-700' : 'text-rose-700'}
                  />
                ))}
          </div>
        </div>
      );

    case 'freeMoney': {
      const isPositive = s.dinheiroLivre >= 0;
      return (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 text-center ${isPositive ? 'bg-teal-50' : 'bg-red-50'}`}>
            <p className={`text-sm font-medium ${isPositive ? 'text-teal-600' : 'text-red-600'}`}>Dinheiro Livre</p>
            <p className={`text-3xl font-bold mt-1 ${isPositive ? 'text-teal-800' : 'text-red-700'}`}>
              {formatCurrency(s.dinheiroLivre)}
            </p>
            <p className={`text-xs mt-1 ${isPositive ? 'text-teal-500' : 'text-red-500'}`}>
              {isPositive ? 'Sobra após todas as contas fixas e variáveis' : 'Deficit após todas as contas fixas e variáveis'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Como é calculado</p>
            <CalcRow sign="+" label="Receita Total" value={s.incomeTotal} valueColor="text-emerald-700" />
            <CalcRow sign="−" label="Contas Pagas" value={s.paidTotal} valueColor="text-rose-600" />
            <CalcRow sign="−" label="Pendentes" value={s.pendingTotal} valueColor="text-amber-600" />
            {s.overdueTotal > 0 && (
              <CalcRow sign="−" label="Atrasadas" value={s.overdueTotal} valueColor="text-red-600" />
            )}
            <CalcRow sign="−" label="Gastos Variáveis" value={s.randomTotal} valueColor="text-amber-600" />
            <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <span className="w-4 text-center font-bold text-gray-400">=</span>
                Dinheiro Livre
              </span>
              <span className={`font-bold text-lg ${isPositive ? 'text-teal-700' : 'text-red-600'}`}>
                {formatCurrency(s.dinheiroLivre)}
              </span>
            </div>
          </div>

          {s.pendingBills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contas Pendentes</p>
              {s.pendingBills.slice(0, 5).map((bill: any) => (
                <ItemRow key={bill.id} name={bill.name} sub={`Vence ${fmtDate(bill.dueDate)}`} value={Number(bill.value)} valueColor="text-amber-700" />
              ))}
              {s.pendingBills.length > 5 && (
                <p className="text-xs text-gray-400 text-center mt-2">+ {s.pendingBills.length - 5} outras contas</p>
              )}
            </div>
          )}
        </div>
      );
    }

    case 'variable':
      return (
        <div className="space-y-3">
          <div className="bg-amber-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-amber-700">{s.randomItems.length} gasto(s)</span>
            <span className="font-bold text-amber-800">{formatCurrency(s.randomTotal)}</span>
          </div>
          <div>
            {s.randomItems.length === 0
              ? <EmptyState message="Nenhum gasto variável neste mês" />
              : s.randomItems.map((item: any) => (
                  <ItemRow key={item.id} name={item.name} sub={fmtDate(item.date)} value={Number(item.value)} valueColor="text-amber-700" />
                ))}
          </div>
        </div>
      );

    case 'topay':
      return (
        <div className="space-y-4">
          <div className="bg-orange-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-orange-700">
              {s.pendingBills.length + s.overdueBills.length} conta(s) a pagar
            </span>
            <span className="font-bold text-orange-800">{formatCurrency(s.pendingTotal + s.overdueTotal)}</span>
          </div>

          {s.overdueBills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-600">Atrasadas — {formatCurrency(s.overdueTotal)}</p>
              </div>
              {s.overdueBills.map((bill: any) => (
                <ItemRow key={bill.id} name={bill.name} sub={`Venceu ${fmtDate(bill.dueDate)}`} value={Number(bill.value)} valueColor="text-red-600" />
              ))}
            </div>
          )}

          {s.pendingBills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-600">Pendentes — {formatCurrency(s.pendingTotal)}</p>
              </div>
              {s.pendingBills.map((bill: any) => (
                <ItemRow key={bill.id} name={bill.name} sub={`Vence ${fmtDate(bill.dueDate)}`} value={Number(bill.value)} valueColor="text-amber-700" />
              ))}
            </div>
          )}

          {s.pendingBills.length === 0 && s.overdueBills.length === 0 && (
            <EmptyState message="Nenhuma conta pendente ou atrasada" />
          )}
        </div>
      );

    case 'invested':
      return (
        <div className="space-y-3">
          <div className="bg-purple-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-purple-700">{s.investmentItems.length} aporte(s)</span>
            <span className="font-bold text-purple-800">{formatCurrency(s.investedTotal)}</span>
          </div>
          <div>
            {s.investmentItems.length === 0
              ? <EmptyState message="Nenhum investimento iniciado neste mês" />
              : s.investmentItems.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium text-gray-800 truncate">{inv.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {inv.cdiPercent}% CDI · {inv.durationMonths} meses · início {fmtDate(inv.startDate)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-purple-700 shrink-0">
                      {formatCurrency(Number(inv.initialAmount))}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      );

    case 'pending':
      return (
        <div className="space-y-3">
          <div className="bg-amber-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-amber-700">{s.pendingCount} conta(s) pendente(s)</span>
            <span className="font-bold text-amber-800">{formatCurrency(s.pendingTotal)}</span>
          </div>
          <div>
            {s.pendingBills.length === 0
              ? <EmptyState message="Nenhuma conta pendente neste mês" />
              : s.pendingBills.map((bill: any) => (
                  <ItemRow key={bill.id} name={bill.name} sub={`Vence ${fmtDate(bill.dueDate)}`} value={Number(bill.value)} valueColor="text-amber-700" />
                ))}
          </div>
        </div>
      );

    case 'overdue':
      return (
        <div className="space-y-3">
          <div className="bg-rose-50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-rose-700">{s.overdueCount} conta(s) atrasada(s)</span>
            <span className="font-bold text-rose-800">{formatCurrency(s.overdueTotal)}</span>
          </div>
          <div>
            {s.overdueBills.length === 0
              ? <EmptyState message="Nenhuma conta atrasada" />
              : s.overdueBills.map((bill: any) => (
                  <ItemRow key={bill.id} name={bill.name} sub={`Venceu ${fmtDate(bill.dueDate)}`} value={Number(bill.value)} valueColor="text-rose-700" />
                ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

export const DashboardCardModal = ({ type, onClose, monthlyStats }: DashboardCardModalProps) => {
  const { Icon, title, description, iconBg, iconBorder, iconColor, gradientFrom, gradientTo } = config[type];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-y-0 right-0 left-0 md:left-[var(--sidebar-offset)] bg-gray-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay overflow-y-auto transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative modal-panel overflow-hidden max-h-[calc(100vh-3rem)] sm:max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className={`h-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} shrink-0`} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${iconBg} border ${iconBorder}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {renderContent(type, monthlyStats)}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
