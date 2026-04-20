import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/finance';
import { X, Scissors, Calendar, Hash, ChevronRight } from 'lucide-react';
import type { Bill } from '../types';

interface InstallmentModalProps {
  bill: Bill;
  onClose: () => void;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({ bill, onClose }) => {
  const { createInstallments } = useFinance();
  const [numberOfInstallments, setNumberOfInstallments] = useState(2);
  const [firstDueDate, setFirstDueDate] = useState(
    bill.dueDate ? bill.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Calculate installment values with rounding correction
  const installmentPreview = useMemo(() => {
    const baseValue = Math.floor((bill.value / numberOfInstallments) * 100) / 100;
    const remainder = Math.round((bill.value - baseValue * numberOfInstallments) * 100) / 100;

    return Array.from({ length: numberOfInstallments }, (_, i) => {
      const isLast = i === numberOfInstallments - 1;
      const value = isLast ? baseValue + remainder : baseValue;
      const dueDate = new Date(firstDueDate + 'T12:00:00');
      dueDate.setMonth(dueDate.getMonth() + i);

      return {
        number: i + 1,
        value,
        dueDate: dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
    });
  }, [bill.value, numberOfInstallments, firstDueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createInstallments(bill.id, numberOfInstallments, firstDueDate);
      onClose();
    } catch (error) {
      console.error('Error creating installments:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-500 shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100">
              <Scissors className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Parcelar Conta</h2>
              <p className="text-sm text-gray-400">Divida em parcelas mensais</p>
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto border-t border-gray-100 p-6 space-y-5">
            {/* Bill info card */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Conta original</p>
              <p className="font-semibold text-gray-900 text-lg">{bill.name}</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mt-1">
                {formatCurrency(bill.value)}
              </p>
            </div>

            {/* Number of installments */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número de Parcelas</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={2}
                  max={48}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-gray-900"
                  value={numberOfInstallments}
                  onChange={e => setNumberOfInstallments(Math.max(2, Math.min(48, parseInt(e.target.value) || 2)))}
                />
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Mínimo 2, máximo 48 parcelas</p>
            </div>

            {/* First due date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vencimento da 1ª Parcela</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-gray-900"
                  value={firstDueDate}
                  onChange={e => setFirstDueDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Value per installment highlight */}
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 text-center">
              <p className="text-sm text-violet-600 font-medium mb-1">{numberOfInstallments}x de</p>
              <p className="text-3xl font-bold text-violet-700">
                {formatCurrency(installmentPreview[0]?.value || 0)}
              </p>
              {installmentPreview.length > 1 && installmentPreview[installmentPreview.length - 1].value !== installmentPreview[0].value && (
                <p className="text-xs text-violet-500 mt-1">
                  Última parcela: {formatCurrency(installmentPreview[installmentPreview.length - 1].value)}
                </p>
              )}
            </div>

            {/* Installment preview list */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Prévia das Parcelas</p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                {installmentPreview.map(inst => (
                  <div key={inst.number} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-violet-700 text-xs font-bold shrink-0">
                        {inst.number}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {bill.name} ({inst.number}/{numberOfInstallments})
                        </p>
                        <p className="text-xs text-gray-400">{inst.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(inst.value)}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Parcelando...
                </span>
              ) : (
                `Parcelar em ${numberOfInstallments}x`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
