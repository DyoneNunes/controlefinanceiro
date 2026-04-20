import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useGroup } from '../context/GroupContext'; 
import { BillForm } from './BillForm';
import { InstallmentModal } from './InstallmentModal';
import { SortableHeader } from './SortableHeader';
import { MonthSection } from './MonthSection';
import { useSortableTable } from '../hooks/useSortableTable';
import type { SortColumnConfig } from '../hooks/useSortableTable';
import { useMonthlyGroups } from '../hooks/useMonthlyGroups';
import { formatCurrency } from '../utils/finance';
import { format, parseISO } from 'date-fns';
import { Check, Plus, MoreVertical, XCircle, Scissors } from 'lucide-react';
import clsx from 'clsx';
import type { Bill, BillStatus } from '../types';

export const BillList = () => {
  const { bills, markAsPaid, deleteBill } = useFinance();
  const { groups } = useGroup(); // Use useGroup
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [installmentBill, setInstallmentBill] = useState<Bill | null>(null);
  const [filter, setFilter] = useState<BillStatus | 'all'>('all');

  const filteredBills = bills.filter(bill => {
    if (filter === 'all') return true;
    return bill.status === filter;
  });

  const billSortColumns = useMemo<SortColumnConfig<Bill>[]>(() => [
    { key: 'name', type: 'string' },
    { key: 'groupId', type: 'string', getValue: (b) => getGroupName(b.groupId) },
    { key: 'dueDate', type: 'date' },
    { key: 'value', type: 'number' },
    { key: 'status', type: 'status', statusOrder: { overdue: 0, pending: 1, paid: 2 } },
    { key: 'paidDate', type: 'date' },
  ], [groups]);

  const { sortedData: sortedBills, sortColumn, sortDirection, toggleSort } = useSortableTable(filteredBills, billSortColumns);

  const billDateExtractor = useCallback((b: Bill) => b.dueDate, []);
  const billValueExtractor = useCallback((b: Bill) => b.value, []);
  const monthGroups = useMonthlyGroups(sortedBills, billDateExtractor, billValueExtractor);

  const [openMonths, setOpenMonths] = useState<Set<string>>(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return new Set([currentKey]);
  });

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'N/A';
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Renders the installment badge if the bill is part of an installment group */
  const InstallmentBadge = ({ bill }: { bill: Bill }) => {
    if (!bill.installmentNumber || !bill.installmentTotal) return null;
    return (
      <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold border border-violet-200 whitespace-nowrap">
        {bill.installmentNumber}/{bill.installmentTotal}
      </span>
    );
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

      {filteredBills.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Nenhuma conta encontrada</p>
          <p className="text-sm">Tente mudar o filtro ou adicione uma nova conta.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthGroups.map(group => (
            <MonthSection
              key={group.key}
              monthKey={group.key}
              label={group.label}
              count={group.count}
              totalValue={group.totalValue}
              isCurrent={group.isCurrent}
              isOpen={openMonths.has(group.key)}
              onToggle={() => toggleMonth(group.key)}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Mobile: cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {group.items.map(bill => (
                    <div key={bill.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate mr-2">
                          {bill.name}
                          <InstallmentBadge bill={bill} />
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(bill.status)}`}>
                          {getStatusLabel(bill.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{getGroupName(bill.groupId)}</span>
                        <span className="text-gray-500">{format(parseISO(bill.dueDate), 'dd/MM/yyyy')}</span>
                      </div>
                      {bill.paidDate && (
                        <div className="text-xs text-emerald-600">
                          Pago em {format(parseISO(bill.paidDate), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{formatCurrency(bill.value)}</span>
                        <div className="flex items-center gap-2">
                          <div className="relative" ref={openMenuId === bill.id ? menuRef : undefined}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === bill.id ? null : bill.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenuId === bill.id && (
                              <ActionMenu
                                bill={bill}
                                onConfirm={markAsPaid}
                                onDelete={deleteBill}
                                onInstallment={(b) => { setInstallmentBill(b); setOpenMenuId(null); }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-visible">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <SortableHeader label="Descrição" columnKey="name" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Grupo" columnKey="groupId" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Vencimento" columnKey="dueDate" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Valor" columnKey="value" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Status" columnKey="status" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Data do Pagamento" columnKey="paidDate" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <th className="px-6 py-4 text-sm font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.items.map(bill => (
                        <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {bill.name}
                            <InstallmentBadge bill={bill} />
                          </td>
                          <td className="px-6 py-4 text-gray-600">{getGroupName(bill.groupId)}</td>
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
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {bill.paidDate
                              ? format(parseISO(bill.paidDate), 'dd/MM/yyyy HH:mm')
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <div className="relative inline-block" ref={openMenuId === bill.id ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === bill.id ? null : bill.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === bill.id && (
                                <ActionMenu
                                  bill={bill}
                                  onConfirm={markAsPaid}
                                  onDelete={deleteBill}
                                  onInstallment={(b) => { setInstallmentBill(b); setOpenMenuId(null); }}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </MonthSection>
          ))}
        </div>
      )}

      {isFormOpen && <BillForm onClose={() => setIsFormOpen(false)} />}
      {installmentBill && <InstallmentModal bill={installmentBill} onClose={() => setInstallmentBill(null)} />}
    </div>
  );
};

interface ActionMenuProps {
  bill: Bill;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
  onInstallment: (bill: Bill) => void;
}

const ActionMenu = ({ bill, onConfirm, onDelete, onInstallment }: ActionMenuProps) => {
  const canInstallment = bill.status !== 'paid' && !bill.installmentNumber;

  return (
    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
      {bill.status !== 'paid' && (
        <button
          onClick={() => { onConfirm(bill.id); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          Marcar como Pago
        </button>
      )}
      {canInstallment && (
        <button
          onClick={() => onInstallment(bill)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
        >
          <Scissors className="w-4 h-4" />
          Parcelar
        </button>
      )}
      <div className="my-1 border-t border-gray-100" />
      <button
        onClick={() => { if (window.confirm('Tem certeza que deseja cancelar esta conta? Ela não aparecerá mais nos cálculos mensais.')) onDelete(bill.id); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
      >
        <XCircle className="w-4 h-4" />
        Cancelar Conta
      </button>
    </div>
  );
};
