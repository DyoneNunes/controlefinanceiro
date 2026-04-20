import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useGroup } from '../context/GroupContext';
import { IncomeForm } from './IncomeForm';
import { SortableHeader } from './SortableHeader';
import { MonthSection } from './MonthSection';
import { useSortableTable } from '../hooks/useSortableTable';
import type { SortColumnConfig } from '../hooks/useSortableTable';
import { useMonthlyGroups } from '../hooks/useMonthlyGroups';
import { formatCurrency } from '../utils/finance';
import { format, parseISO } from 'date-fns';
import { Plus, TrendingUp, MoreVertical, XCircle, Check, Pencil } from 'lucide-react';
import type { Income } from '../types';

const statusConfig = {
  pending: { label: 'Pendente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  received: { label: 'Recebido', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
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

export const IncomeList = () => {
  const { incomes, deleteIncome, markIncomeAsReceived } = useFinance();
  const { groups } = useGroup();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>();

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'N/A';
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const incomeSortColumns = useMemo<SortColumnConfig<Income>[]>(() => [
    { key: 'description', type: 'string' },
    { key: 'groupId', type: 'string', getValue: (i) => getGroupName(i.groupId) },
    { key: 'date', type: 'date' },
    { key: 'value', type: 'number' },
    { key: 'status', type: 'status', statusOrder: { pending: 0, received: 1 } },
    { key: 'receivedDate', type: 'date' },
  ], [groups]);

  const { sortedData: sortedIncomes, sortColumn, sortDirection, toggleSort } = useSortableTable(incomes, incomeSortColumns);

  const incDateExtractor = useCallback((i: Income) => i.date, []);
  const incValueExtractor = useCallback((i: Income) => i.value, []);
  const monthGroups = useMonthlyGroups(sortedIncomes, incDateExtractor, incValueExtractor);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = (income: Income) => {
    setOpenMenuId(null);
    setEditingIncome(income);
    setIsFormOpen(true);
  };

  const handleMarkReceived = async (id: string) => {
    setOpenMenuId(null);
    await markIncomeAsReceived(id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingIncome(undefined);
  };

  return (
    <div className="space-y-6 animated-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Entradas</h2>
          <p className="text-gray-500 mt-1">Gerencie suas rendas e recebimentos.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Entrada
        </button>
      </div>

      {incomes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Nenhuma entrada registrada</p>
          <p className="text-sm">Adicione seu salário ou outras rendas.</p>
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
                  {group.items.map(income => (
                    <div key={income.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate mr-2">{income.description}</span>
                        <span className="text-sm text-gray-500 shrink-0">{format(parseISO(income.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{getGroupName(income.groupId)}</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(income.value)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <StatusBadge status={income.status || 'pending'} />
                        {income.receivedDate && (
                          <span className="text-xs text-emerald-600">
                            Recebido em {format(parseISO(income.receivedDate), 'dd/MM/yyyy HH:mm')}
                          </span>
                        )}
                        <div className="relative" ref={openMenuId === income.id ? menuRef : undefined}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === income.id ? null : income.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === income.id && (
                            <ActionMenu
                              income={income}
                              onEdit={handleEdit}
                              onMarkReceived={handleMarkReceived}
                              onDelete={deleteIncome}
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
                        <SortableHeader label="Descrição" columnKey="description" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Grupo" columnKey="groupId" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Data" columnKey="date" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Valor" columnKey="value" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Status" columnKey="status" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <SortableHeader label="Data de Recebimento" columnKey="receivedDate" activeColumn={sortColumn} direction={sortDirection} onToggle={toggleSort} />
                        <th className="px-6 py-4 text-sm font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.items.map(income => (
                        <tr key={income.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-gray-900">{income.description}</td>
                          <td className="px-6 py-4 text-gray-600">{getGroupName(income.groupId)}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {format(parseISO(income.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 font-medium text-emerald-600">
                            {formatCurrency(income.value)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={income.status || 'pending'} />
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {income.receivedDate
                              ? format(parseISO(income.receivedDate), 'dd/MM/yyyy HH:mm')
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block" ref={openMenuId === income.id ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === income.id ? null : income.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === income.id && (
                                <ActionMenu
                                  income={income}
                                  onEdit={handleEdit}
                                  onMarkReceived={handleMarkReceived}
                                  onDelete={deleteIncome}
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

      {isFormOpen && <IncomeForm onClose={handleCloseForm} income={editingIncome} />}
    </div>
  );
};

interface ActionMenuProps {
  income: Income;
  onEdit: (income: Income) => void;
  onMarkReceived: (id: string) => void;
  onDelete: (id: string) => void;
}

const ActionMenu = ({ income, onEdit, onMarkReceived, onDelete }: ActionMenuProps) => (
  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
    {income.status !== 'received' && (
      <button
        onClick={() => onMarkReceived(income.id)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
      >
        <Check className="w-4 h-4" />
        Marcar como Recebido
      </button>
    )}
    <button
      onClick={() => onEdit(income)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      <Pencil className="w-4 h-4" />
      Editar Entrada
    </button>
    <div className="my-1 border-t border-gray-100" />
    <button
      onClick={() => { if (window.confirm('Tem certeza que deseja cancelar esta entrada? Ela não será mais contabilizada no seu saldo.')) onDelete(income.id); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
    >
      <XCircle className="w-4 h-4" />
      Cancelar Entrada
    </button>
  </div>
);
