import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillList } from './components/BillList';
import { IncomeList } from './components/IncomeList';
import { InvestmentList } from './components/InvestmentList';
import { Login } from './components/Login';

// Higher-order component for route protection
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/bills" element={
        <ProtectedRoute>
          <Layout>
            <BillList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/incomes" element={
        <ProtectedRoute>
          <Layout>
            <IncomeList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/investments" element={
        <ProtectedRoute>
          <Layout>
            <InvestmentList />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
