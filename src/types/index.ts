export type BillStatus = 'pending' | 'paid' | 'overdue';

export interface Bill {
  id: string;
  name: string;
  value: number;
  dueDate: string; // ISO Date String
  status: BillStatus;
  paidDate?: string | null; // ISO Date String
}

export interface Income {
  id: string;
  description: string;
  value: number;
  date: string; // ISO Date String
}

export interface Investment {
  id: string;
  name: string;
  initialAmount: number;
  cdiPercent: number;
  startDate: string; // ISO Date String
  durationMonths: number;
}

export interface RandomExpense {
  id: string;
  name: string;
  value: number;
  date: string; // ISO Date String
  status: BillStatus;
  paidDate?: string | null;
}

export interface DashboardStats {
  paidTotal: number;
  incomeTotal: number;
  balance: number;
  investedTotal: number;
  investmentYield: number;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  pendingTotal: number;
  overdueTotal: number;
  randomExpenseTotal: number;
}
