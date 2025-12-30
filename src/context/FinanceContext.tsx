import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Bill, Income, Investment, DashboardStats } from '../types';
import { calculateStatus } from '../utils/finance';
import { calculateInvestmentReturn } from '../utils/investment';

interface FinanceContextType {
  bills: Bill[];
  incomes: Income[];
  investments: Investment[];
  stats: DashboardStats;
  addBill: (data: Omit<Bill, 'id' | 'status'>) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  refreshBills: () => void;
  addIncome: (data: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addInvestment: (data: Omit<Investment, 'id'>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    paidTotal: 0,
    incomeTotal: 0,
    investedTotal: 0,
    investmentYield: 0,
    balance: 0,
    pendingCount: 0,
    overdueCount: 0,
    paidCount: 0
  });

  const fetchData = async () => {
    try {
      const [billsRes, incomesRes, investmentsRes] = await Promise.all([
        fetch(`${API_URL}/bills`),
        fetch(`${API_URL}/incomes`),
        fetch(`${API_URL}/investments`)
      ]);

      if (billsRes.ok) {
        const billsData = await billsRes.json();
        const processedBills = billsData.map((b: Bill) => ({
             ...b,
             status: calculateStatus(b) // Recalculate status on load based on current date
        }));
        setBills(processedBills);
      }
      if (incomesRes.ok) setIncomes(await incomesRes.json());
      if (investmentsRes.ok) setInvestments(await investmentsRes.json());

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Stats whenever data changes
  useEffect(() => {
    const billStats = bills.reduce((acc, bill) => {
      if (bill.status === 'paid') {
        acc.paidCount++;
        acc.paidTotal += Number(bill.value);
      } else if (bill.status === 'overdue') {
        acc.overdueCount++;
      } else {
        acc.pendingCount++;
      }
      return acc;
    }, { paidTotal: 0, pendingCount: 0, overdueCount: 0, paidCount: 0 });

    const incomeTotal = incomes.reduce((sum, income) => sum + Number(income.value), 0);
    const investedTotal = investments.reduce((sum, inv) => sum + Number(inv.initialAmount), 0);
    
    const investmentYield = investments.reduce((sum, inv) => {
      const finalAmount = calculateInvestmentReturn(inv.initialAmount, inv.cdiPercent, inv.durationMonths);
      return sum + (finalAmount - inv.initialAmount);
    }, 0);

    setStats({
      ...billStats,
      incomeTotal,
      investedTotal,
      investmentYield,
      balance: incomeTotal - billStats.paidTotal - investedTotal
    });
  }, [bills, incomes, investments]);

  // Bills Actions
  const addBill = async (data: Omit<Bill, 'id' | 'status'>) => {
    try {
      const res = await fetch(`${API_URL}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'pending' })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/bills/${id}/pay`, {
        method: 'PATCH'
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };
  
  const deleteBill = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/bills/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };
  
  const refreshBills = () => {
    fetchData();
  };

  // Incomes Actions
  const addIncome = async (data: Omit<Income, 'id'>) => {
    try {
        const res = await fetch(`${API_URL}/incomes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteIncome = async (id: string) => {
     try {
        const res = await fetch(`${API_URL}/incomes/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  // Investments Actions
  const addInvestment = async (data: Omit<Investment, 'id'>) => {
    try {
        const res = await fetch(`${API_URL}/investments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteInvestment = async (id: string) => {
      try {
        const res = await fetch(`${API_URL}/investments/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <FinanceContext.Provider value={{ 
      bills, incomes, investments, stats, 
      addBill, markAsPaid, deleteBill, refreshBills, 
      addIncome, deleteIncome,
      addInvestment, deleteInvestment
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
