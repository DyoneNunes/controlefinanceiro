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
  addBill: (data: Omit<Bill, 'id' | 'status'> & { groupId: string }) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  refreshBills: () => void;
  addIncome: (data: Omit<Income, 'id'> & { groupId: string }) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addInvestment: (data: Omit<Investment, 'id'> & { groupId: string }) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addRandomExpense: (data: Omit<RandomExpense, 'id' | 'status'> & { groupId: string }) => Promise<void>;
  deleteRandomExpense: (id: string) => Promise<void>;
  markRandomExpenseAsPaid: (id: string) => Promise<void>;
  loading: boolean; // Added loading state
  error: string | null; // Added error state
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
  const [loading, setLoading] = useState(false); // New loading state
  const [error, setError] = useState<string | null>(null); // New error state

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
    
    setLoading(true); // Set loading true when fetching data
    setError(null); // Clear previous errors
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

    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to fetch financial data.'); // Set error state
    } finally {
      setLoading(false); // Set loading false after fetching
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
  const addBill = async (data: Omit<Bill, 'id' | 'status'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/bills`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, status: 'pending', group_id: data.groupId }) // Pass group_id
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add bill.');
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      throw err; // Re-throw to allow component to handle
    } finally { setLoading(false); }
  };

  const markAsPaid = async (id: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/bills/${id}/pay`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to mark bill as paid.');
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };
  
  const deleteBill = async (id: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/bills/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete bill.');
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };
  
  const refreshBills = () => {
    fetchData();
  };

  // Incomes Actions
  const addIncome = async (data: Omit<Income, 'id'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
        const res = await fetch(`${API_URL}/incomes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ...data, group_id: data.groupId }) // Pass group_id
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to add income.');
        }
        fetchData();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };

  const deleteIncome = async (id: string) => {
    setLoading(true); setError(null);
     try {
        const res = await fetch(`${API_URL}/incomes/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to delete income.');
        }
        fetchData();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };

  // Investments Actions
  const addInvestment = async (data: Omit<Investment, 'id'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
        const res = await fetch(`${API_URL}/investments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ...data, group_id: data.groupId }) // Pass group_id
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to add investment.');
        }
        fetchData();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };

  const deleteInvestment = async (id: string) => {
    setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_URL}/investments/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to delete investment.');
        }
        fetchData();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };

  // Random Expenses Actions
  const addRandomExpense = async (data: Omit<RandomExpense, 'id' | 'status'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
        const res = await fetch(`${API_URL}/random-expenses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ...data, group_id: data.groupId }) // Pass group_id
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to add random expense.');
        }
        fetchData();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };

  const deleteRandomExpense = async (id: string) => {
    setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_URL}/random-expenses/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to delete random expense.');
        }
        fetchData();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };

  const markRandomExpenseAsPaid = async (id: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/random-expenses/${id}/pay`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to mark random expense as paid.');
      }
      fetchData();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message);
      throw err;
    } finally { setLoading(false); }
  };

  return (
    <FinanceContext.Provider value={{ 
      bills, incomes, investments, randomExpenses, stats, 
      addBill, markAsPaid, deleteBill, refreshBills, 
      addIncome, deleteIncome,
      addInvestment, deleteInvestment,
      addRandomExpense, deleteRandomExpense, markRandomExpenseAsPaid,
      loading, error // Exposed loading and error
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
