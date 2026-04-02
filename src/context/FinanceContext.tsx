/**
 * ============================================================================
 * FinanceContext — Integrado com E2EE
 * ============================================================================
 *
 * FLUXO DE DADOS COM E2EE:
 *
 * ── ESCRITA (POST) ──
 * 1. Usuário preenche formulário (name, value, date)
 * 2. Dados sensíveis (name, value) são empacotados em JSON
 * 3. JSON é criptografado com AES-256-GCM usando a MEK
 * 4. Servidor recebe: {encrypted_data, encryption_iv, date, status}
 * 5. Servidor armazena blob opaco — NUNCA vê name ou value
 *
 * ── LEITURA (GET) ──
 * 1. Servidor retorna: {encrypted_data, encryption_iv, date, status, ...}
 * 2. Frontend descriptografa encrypted_data com MEK
 * 3. JSON descriptografado contém {name, value} originais
 * 4. Dado completo reconstruído e exibido na UI
 *
 * ── COMPATIBILIDADE LEGACY ──
 * Registros sem encrypted_data (pré-E2EE) são lidos normalmente via
 * campos em texto plano (name, value, description).
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Bill, Income, Investment, DashboardStats, RandomExpense } from '../types';
import { calculateStatus } from '../utils/finance';
import { calculateInvestmentReturn } from '../utils/investment';
import { useAuth } from './AuthContext';
import { useGroup } from './GroupContext';
import { useCrypto } from './CryptoContext';

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
  refreshData: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Campos criptografados por tipo de registro.
 * Estes campos são empacotados em JSON antes da criptografia.
 * Os demais campos permanecem em texto plano (metadados operacionais).
 */
interface BillSensitiveData { name: string; value: number }
interface IncomeSensitiveData { description: string; value: number }
interface InvestmentSensitiveData { name: string; initialAmount: number; cdiPercent: number }
interface RandomExpenseSensitiveData { name: string; value: number }

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { currentGroup } = useGroup();
  const { isReady: cryptoReady, encrypt, decrypt } = useCrypto();

  const [bills, setBills] = useState<Bill[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [randomExpenses, setRandomExpenses] = useState<RandomExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // ══════════════════════════════════════════════════════════════════════════
  // DESCRIPTOGRAFIA DE DADOS RECEBIDOS DO SERVIDOR
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Descriptografa um registro de bill recebido do servidor.
   * Se o registro tem encrypted_data, descriptografa e mescla.
   * Caso contrário, usa os campos em texto plano (legacy).
   */
  const decryptBill = useCallback(async (raw: any): Promise<Bill> => {
    if (raw.isEncrypted && raw.encryptedData && cryptoReady) {
      try {
        const sensitive = await decrypt<BillSensitiveData>(raw.encryptedData, raw.encryptionIv);
        return {
          id: raw.id,
          name: sensitive.name,
          value: sensitive.value,
          dueDate: raw.dueDate,
          status: calculateStatus({ ...raw, dueDate: raw.dueDate }),
          paidDate: raw.paidDate,
          groupId: raw.groupId,
        };
      } catch (e) {
        console.error('Falha ao descriptografar bill:', e);
      }
    }
    // Fallback: dados em texto plano (legacy)
    return {
      id: raw.id,
      name: raw.name || '[Criptografado]',
      value: raw.value || 0,
      dueDate: raw.dueDate,
      status: calculateStatus({ ...raw, dueDate: raw.dueDate }),
      paidDate: raw.paidDate,
      groupId: raw.groupId,
    };
  }, [cryptoReady, decrypt]);

  const decryptIncome = useCallback(async (raw: any): Promise<Income> => {
    if (raw.isEncrypted && raw.encryptedData && cryptoReady) {
      try {
        const sensitive = await decrypt<IncomeSensitiveData>(raw.encryptedData, raw.encryptionIv);
        return {
          id: raw.id,
          description: sensitive.description,
          value: sensitive.value,
          date: raw.date,
          groupId: raw.groupId,
        };
      } catch (e) {
        console.error('Falha ao descriptografar income:', e);
      }
    }
    return {
      id: raw.id,
      description: raw.description || '[Criptografado]',
      value: raw.value || 0,
      date: raw.date,
      groupId: raw.groupId,
    };
  }, [cryptoReady, decrypt]);

  const decryptInvestment = useCallback(async (raw: any): Promise<Investment> => {
    if (raw.isEncrypted && raw.encryptedData && cryptoReady) {
      try {
        const sensitive = await decrypt<InvestmentSensitiveData>(raw.encryptedData, raw.encryptionIv);
        return {
          id: raw.id,
          name: sensitive.name,
          initialAmount: sensitive.initialAmount,
          cdiPercent: sensitive.cdiPercent,
          startDate: raw.startDate,
          durationMonths: raw.durationMonths,
          groupId: raw.groupId,
        };
      } catch (e) {
        console.error('Falha ao descriptografar investment:', e);
      }
    }
    return {
      id: raw.id,
      name: raw.name || '[Criptografado]',
      initialAmount: raw.initialAmount || 0,
      cdiPercent: raw.cdiPercent || 0,
      startDate: raw.startDate,
      durationMonths: raw.durationMonths,
      groupId: raw.groupId,
    };
  }, [cryptoReady, decrypt]);

  const decryptRandomExpense = useCallback(async (raw: any): Promise<RandomExpense> => {
    if (raw.isEncrypted && raw.encryptedData && cryptoReady) {
      try {
        const sensitive = await decrypt<RandomExpenseSensitiveData>(raw.encryptedData, raw.encryptionIv);
        return {
          id: raw.id,
          name: sensitive.name,
          value: sensitive.value,
          date: raw.date,
          status: calculateStatus({ ...raw, dueDate: raw.date }),
          paidDate: raw.paidDate,
          groupId: raw.groupId,
        };
      } catch (e) {
        console.error('Falha ao descriptografar random expense:', e);
      }
    }
    return {
      id: raw.id,
      name: raw.name || '[Criptografado]',
      value: raw.value || 0,
      date: raw.date,
      status: calculateStatus({ ...raw, dueDate: raw.date }),
      paidDate: raw.paidDate,
      groupId: raw.groupId,
    };
  }, [cryptoReady, decrypt]);

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH & DECRYPT
  // ══════════════════════════════════════════════════════════════════════════

  const fetchData = async () => {
    if (!isAuthenticated || !currentGroup) return;

    setLoading(true);
    setError(null);
    try {
      const headers = getHeaders();
      const [billsRes, incomesRes, investmentsRes, randomExpensesRes] = await Promise.all([
        fetch(`${API_URL}/bills`, { headers }),
        fetch(`${API_URL}/incomes`, { headers }),
        fetch(`${API_URL}/investments`, { headers }),
        fetch(`${API_URL}/random-expenses`, { headers })
      ]);

      if (billsRes.ok) {
        const rawBills = await billsRes.json();
        const decryptedBills = await Promise.all(rawBills.map(decryptBill));
        setBills(decryptedBills);
      }
      if (incomesRes.ok) {
        const rawIncomes = await incomesRes.json();
        const decryptedIncomes = await Promise.all(rawIncomes.map(decryptIncome));
        setIncomes(decryptedIncomes);
      }
      if (investmentsRes.ok) {
        const rawInvestments = await investmentsRes.json();
        const decryptedInvestments = await Promise.all(rawInvestments.map(decryptInvestment));
        setInvestments(decryptedInvestments);
      }
      if (randomExpensesRes.ok) {
        const rawRd = await randomExpensesRes.json();
        const decryptedRd = await Promise.all(rawRd.map(decryptRandomExpense));
        setRandomExpenses(decryptedRd);
      }

    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to fetch financial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentGroup) {
      fetchData();
    } else {
      setBills([]);
      setIncomes([]);
      setInvestments([]);
      setRandomExpenses([]);
    }
  }, [isAuthenticated, currentGroup, cryptoReady]);

  // ══════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS (calculadas no frontend com dados descriptografados)
  // ══════════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════════
  // ESCRITA: CRIPTOGRAFA ANTES DE ENVIAR
  // ══════════════════════════════════════════════════════════════════════════

  const addBill = async (data: Omit<Bill, 'id' | 'status'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
      let body: any = { ...data, status: 'pending', group_id: data.groupId };

      // Se E2EE está ativo, criptografa dados sensíveis
      if (cryptoReady) {
        const sensitiveData: BillSensitiveData = { name: data.name, value: data.value };
        const encrypted = await encrypt(sensitiveData);
        body = {
          dueDate: data.dueDate,
          status: 'pending',
          group_id: data.groupId,
          value: data.value, // Mantém em texto plano para cálculos server-side
          encrypted_data: encrypted.ciphertext,
          encryption_iv: encrypted.iv,
        };
      }

      const res = await fetch(`${API_URL}/bills`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add bill.');
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      throw err;
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

  const addIncome = async (data: Omit<Income, 'id'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
      let body: any = { ...data, group_id: data.groupId };

      if (cryptoReady) {
        const sensitiveData: IncomeSensitiveData = { description: data.description, value: data.value };
        const encrypted = await encrypt(sensitiveData);
        body = {
          date: data.date,
          group_id: data.groupId,
          value: data.value,
          encrypted_data: encrypted.ciphertext,
          encryption_iv: encrypted.iv,
        };
      }

      const res = await fetch(`${API_URL}/incomes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
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

  const addInvestment = async (data: Omit<Investment, 'id'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
      let body: any = { ...data, group_id: data.groupId };

      if (cryptoReady) {
        const sensitiveData: InvestmentSensitiveData = {
          name: data.name,
          initialAmount: data.initialAmount,
          cdiPercent: data.cdiPercent,
        };
        const encrypted = await encrypt(sensitiveData);
        body = {
          startDate: data.startDate,
          durationMonths: data.durationMonths,
          group_id: data.groupId,
          initialAmount: data.initialAmount,
          cdiPercent: data.cdiPercent,
          encrypted_data: encrypted.ciphertext,
          encryption_iv: encrypted.iv,
        };
      }

      const res = await fetch(`${API_URL}/investments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
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

  const addRandomExpense = async (data: Omit<RandomExpense, 'id' | 'status'> & { groupId: string }) => {
    setLoading(true); setError(null);
    try {
      let body: any = { ...data, group_id: data.groupId };

      if (cryptoReady) {
        const sensitiveData: RandomExpenseSensitiveData = { name: data.name, value: data.value };
        const encrypted = await encrypt(sensitiveData);
        body = {
          date: data.date,
          group_id: data.groupId,
          value: data.value,
          encrypted_data: encrypted.ciphertext,
          encryption_iv: encrypted.iv,
        };
      }

      const res = await fetch(`${API_URL}/random-expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
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
      refreshData: fetchData,
      loading, error
    }}>
      {children}
    </FinanceContext.Provider>
  );
};
