import type { Bill, BillStatus } from '../types';
import { isBefore, startOfDay, parseISO } from 'date-fns';

export const calculateStatus = (bill: Bill): BillStatus => {
  if (bill.paidDate) return 'paid';
  
  const today = startOfDay(new Date());
  const dueDate = startOfDay(parseISO(bill.dueDate));
  
  if (isBefore(dueDate, today)) {
    return 'overdue';
  }
  
  return 'pending';
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
