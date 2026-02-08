import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Bill, Income, Investment, DashboardStats, RandomExpense } from '../types';
import { calculateStatus } from '../utils/finance';
import { calculateInvestmentReturn } from '../utils/investment';
import { useAuth } from './AuthContext';
import { useGroup } from './GroupContext';

interface FinanceContextType {
  bills: Bill[];
  incomes: Income[];
  investments: Investment[];
  randomExpenses: RandomExpense[];
  stats: DashboardStats;
  addBill: (data: Omit<Bill, 'id' | 'status'>) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  refreshBills: () => void;
  addIncome: (data: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addInvestment: (data: Omit<Investment, 'id'>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addRandomExpense: (data: Omit<RandomExpense, 'id' | 'status'>) => Promise<void>;
  deleteRandomExpense: (id: string) => Promise<void>;
  markRandomExpenseAsPaid: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { currentGroup } = useGroup();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [randomExpenses, setRandomExpenses] = useState<RandomExpense[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    paidTotal: 0,
    incomeTotal: 0,
    investedTotal: 0,
    investmentYield: 0,
    balance: 0,
    pendingCount: 0,
    overdueCount: 0,
    paidCount: 0,
    pendingTotal: 0,
    overdueTotal: 0,
    randomExpenseTotal: 0
  });

  const getHeaders = () => {
    const token = localStorage.getItem('finance_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Group-ID': currentGroup?.id || ''
    };
  };

  const fetchData = async () => {
    if (!isAuthenticated || !currentGroup) return;
    
    try {
      const headers = getHeaders();
      const [billsRes, incomesRes, investmentsRes, randomExpensesRes] = await Promise.all([
        fetch(`${API_URL}/bills`, { headers }),
        fetch(`${API_URL}/incomes`, { headers }),
        fetch(`${API_URL}/investments`, { headers }),
        fetch(`${API_URL}/random-expenses`, { headers })
      ]);

      if (billsRes.ok) {
        const billsData = await billsRes.json();
        const processedBills = billsData.map((b: Bill) => ({
             ...b,
             status: calculateStatus(b)
        }));
        setBills(processedBills);
      }
      if (incomesRes.ok) setIncomes(await incomesRes.json());
      if (investmentsRes.ok) setInvestments(await investmentsRes.json());
      if (randomExpensesRes.ok) {
         const rdData = await randomExpensesRes.json();
         // We can apply status calculation here too if needed, mapping date -> dueDate
         const processedRd = rdData.map((r: any) => ({
             ...r,
             status: calculateStatus({ ...r, dueDate: r.date }) 
         }));
         setRandomExpenses(processedRd);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentGroup) {
      fetchData();
    } else {
      // Clear data if no group selected (e.g. on logout or loading)
      setBills([]);
      setIncomes([]);
      setInvestments([]);
      setRandomExpenses([]);
    }
  }, [isAuthenticated, currentGroup]); // Re-fetch when group changes

  // Update Stats whenever data changes
  useEffect(() => {
    const billStats = bills.reduce((acc, bill) => {
      const value = Number(bill.value);
      if (bill.status === 'paid') {
        acc.paidCount++;
        acc.paidTotal += value;
      } else if (bill.status === 'overdue') {
        acc.overdueCount++;
        acc.overdueTotal += value;
      } else {
        acc.pendingCount++;
        acc.pendingTotal += value;
      }
      return acc;
    }, { 
      paidTotal: 0, 
      pendingCount: 0, 
      overdueCount: 0, 
      paidCount: 0,
      pendingTotal: 0,
      overdueTotal: 0 
    });

    const incomeTotal = incomes.reduce((sum, income) => sum + Number(income.value), 0);
    const investedTotal = investments.reduce((sum, inv) => sum + Number(inv.initialAmount), 0);
    
    const investmentYield = investments.reduce((sum, inv) => {
      const finalAmount = calculateInvestmentReturn(inv.initialAmount, inv.cdiPercent, inv.durationMonths);
      return sum + (finalAmount - inv.initialAmount);
    }, 0);

    const randomExpenseTotal = randomExpenses.reduce((sum, r) => {
        return sum + Number(r.value);
    }, 0);

    setStats({
      ...billStats,
      incomeTotal,
      investedTotal,
      investmentYield,
      randomExpenseTotal,
      balance: incomeTotal - billStats.paidTotal - investedTotal - randomExpenseTotal
    });
  }, [bills, incomes, investments, randomExpenses]);

  // Bills Actions
  const addBill = async (data: Omit<Bill, 'id' | 'status'>) => {
    try {
      const res = await fetch(`${API_URL}/bills`, {
        method: 'POST',
        headers: getHeaders(),
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
        method: 'PATCH',
        headers: getHeaders()
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };
  
  const deleteBill = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/bills/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
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
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteIncome = async (id: string) => {
     try {
        const res = await fetch(`${API_URL}/incomes/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  // Investments Actions
  const addInvestment = async (data: Omit<Investment, 'id'>) => {
    try {
        const res = await fetch(`${API_URL}/investments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteInvestment = async (id: string) => {
      try {
        const res = await fetch(`${API_URL}/investments/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  // Random Expenses Actions
  const addRandomExpense = async (data: Omit<RandomExpense, 'id' | 'status'>) => {
    try {
        const res = await fetch(`${API_URL}/random-expenses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const deleteRandomExpense = async (id: string) => {
      try {
        const res = await fetch(`${API_URL}/random-expenses/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const markRandomExpenseAsPaid = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/random-expenses/${id}/pay`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <FinanceContext.Provider value={{ 
      bills, incomes, investments, randomExpenses, stats, 
      addBill, markAsPaid, deleteBill, refreshBills, 
      addIncome, deleteIncome,
      addInvestment, deleteInvestment,
      addRandomExpense, deleteRandomExpense, markRandomExpenseAsPaid
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
