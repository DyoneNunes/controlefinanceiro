import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useGroup } from '../context/GroupContext';
import { RandomExpenseForm } from './RandomExpenseForm';
import { SortableHeader } from './SortableHeader';
import { MonthSection } from './MonthSection';
import { useSortableTable } from '../hooks/useSortableTable';
import type { SortColumnConfig } from '../hooks/useSortableTable';
import { useMonthlyGroups } from '../hooks/useMonthlyGroups';
import { formatCurrency } from '../utils/finance';
import { format, parseISO } from 'date-fns';
import { Plus, Shuffle, MoreVertical, Check, Pencil, XCircle } from 'lucide-react';
import type { RandomExpense } from '../types';

const statusConfig = {
  paid: { label: 'Pago', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'Pendente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  overdue: { label: 'Atrasado', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const RandomExpenseList = () => {
  const { randomExpenses, deleteRandomExpense, markRandomExpenseAsPaid, cancelRandomExpensePayment } = useFinance();
  const { groups } = useGroup();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RandomExpense | undefined>();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const expenseSortColumns = useMemo<SortColumnConfig<RandomExpense>[]>(() => [
    { key: 'name', type: 'string' },
    { key: 'groupId', type: 'string', getValue: (e) => getGroupName(e.groupId) },
    { key: 'date', type: 'date' },
    { key: 'value', type: 'number' },
    { key: 'status', type: 'status', statusOrder: { overdue: 0, pending: 1, paid: 2 } },
    { key: 'paidDate', type: 'date' },
  ], [groups]);

  const { sortedData: sortedExpenses, sortColumn, sortDirection, toggleSort } = useSortableTable(randomExpenses, expenseSortColumns);

  const expDateExtractor = useCallback((e: RandomExpense) => e.date, []);
  const expValueExtractor = useCallback((e: RandomExpense) => e.value, []);
  const monthGroups = useMonthlyGroups(sortedExpenses, expDateExtractor, expValueExtractor);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'N/A';
  };

  const handleEdit = (expense: RandomExpense) => {
    setOpenMenuId(null);
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleConfirmPayment = async (id: string) => {
    setOpenMenuId(null);
    await markRandomExpenseAsPaid(id);
  };

  const handleCancelPayment = async (id: string) => {
    setOpenMenuId(null);
    await cancelRandomExpensePayment(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(undefined);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 animated-fade-in">
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

      {randomExpenses.length === 0 ? (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Shuffle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Nenhum gasto encontrado</p>
          <p className="text-sm">Adicione um novo gasto para começar.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
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
                  {group.items.map(expense => (
                    <div key={expense.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate mr-2">{expense.name}</span>
                        <span className="text-sm text-gray-500 shrink-0">{format(parseISO(expense.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{getGroupName(expense.groupId)}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(expense.value)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusBadge status={expense.status} />
                        {expense.paidDate && (
                          <span className="text-xs text-emerald-600">
                            Pago em {format(parseISO(expense.paidDate), 'dd/MM/yyyy HH:mm')}
                          </span>
                        )}
                        <div className="relative" ref={openMenuId === expense.id ? menuRef : undefined}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === expense.id && (
                            <ActionMenu
                              expense={expense}
                              onEdit={handleEdit}
                              onConfirm={handleConfirmPayment}
                              onCancel={handleCancelPayment}
                              onDelete={deleteRandomExpense}
                            />
                          )}
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
                        <SortableHeader label="Data" columnKey="date" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Valor" columnKey="value" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Status" columnKey="status" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Data do Pagamento" columnKey="paidDate" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <th className="px-6 py-4 text-sm font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.items.map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-gray-900">{expense.name}</td>
                          <td className="px-6 py-4 text-gray-600">{getGroupName(expense.groupId)}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {format(parseISO(expense.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {formatCurrency(expense.value)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={expense.status} />
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {expense.paidDate
                              ? format(parseISO(expense.paidDate), 'dd/MM/yyyy HH:mm')
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block" ref={openMenuId === expense.id ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === expense.id && (
                                <ActionMenu
                                  expense={expense}
                                  onEdit={handleEdit}
                                  onConfirm={handleConfirmPayment}
                                  onCancel={handleCancelPayment}
                                  onDelete={deleteRandomExpense}
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

      {isFormOpen && <RandomExpenseForm onClose={handleCloseForm} expense={editingExpense} />}
    </div>
  );
};

interface ActionMenuProps {
  expense: RandomExpense;
  onEdit: (expense: RandomExpense) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

const ActionMenu = ({ expense, onEdit, onConfirm, onCancel, onDelete }: ActionMenuProps) => (
  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
    {expense.status !== 'paid' && (
      <button
        onClick={() => onConfirm(expense.id)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
      >
        <Check className="w-4 h-4" />
        Confirmar Pagamento
      </button>
    )}
    <button
      onClick={() => onEdit(expense)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      <Pencil className="w-4 h-4" />
      Editar Gasto
    </button>
    {expense.status === 'paid' && (
      <button
        onClick={() => onCancel(expense.id)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
      >
        <XCircle className="w-4 h-4" />
        Cancelar Pagamento
      </button>
    )}
    <div className="my-1 border-t border-gray-100" />
    <button
      onClick={() => { if (window.confirm('Tem certeza que deseja cancelar este gasto? Ele não constará mais nas estatísticas.')) onDelete(expense.id); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
    >
      <XCircle className="w-4 h-4" />
      Cancelar Gasto
    </button>
  </div>
);
