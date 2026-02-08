import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { GroupProvider } from './context/GroupContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { BillForm } from './components/BillForm';
import { BillList } from './components/BillList';
import { Login } from './components/Login';
import { IncomeForm } from './components/IncomeForm';
import { IncomeList } from './components/IncomeList';
import { InvestmentForm } from './components/InvestmentForm';
import { InvestmentList } from './components/InvestmentList';
import { RandomExpenseForm } from './components/RandomExpenseForm';
import { RandomExpenseList } from './components/RandomExpenseList';
import { AIAdvisor } from './components/AIAdvisor';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <GroupProvider>
          <FinanceProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              } />
                            <Route path="/bills/new" element={
                              <PrivateRoute>
                                <Layout>
                                  <BillForm onClose={() => window.history.back()} />
                                </Layout>
                              </PrivateRoute>
                            } />
                            <Route path="/bills" element={
                              <PrivateRoute>
                                <Layout>
                                  <BillList />
                                </Layout>
                              </PrivateRoute>
                            } />
                            <Route path="/incomes/new" element={
                              <PrivateRoute>
                                <Layout>
                                  <IncomeForm onClose={() => window.history.back()} />
                                </Layout>
                              </PrivateRoute>
                            } />
                            <Route path="/incomes" element={
                              <PrivateRoute>
                                <Layout>
                                  <IncomeList />
                                </Layout>
                              </PrivateRoute>
                            } />
                            <Route path="/investments/new" element={
                               <PrivateRoute>
                                  <Layout>
                                     <InvestmentForm onClose={() => window.history.back()} />
                                  </Layout>
                               </PrivateRoute>
                            } />
                             <Route path="/investments" element={
                               <PrivateRoute>
                                  <Layout>
                                     <InvestmentList />
                                  </Layout>
                               </PrivateRoute>
                            } />
                             <Route path="/expenses/new" element={
                               <PrivateRoute>
                                  <Layout>
                                     <RandomExpenseForm onClose={() => window.history.back()} />
                                  </Layout>
                               </PrivateRoute>
                            } />            <Route path="/expenses" element={
               <PrivateRoute>
                  <Layout>
                     <RandomExpenseList />
                  </Layout>
               </PrivateRoute>
            } />
             <Route path="/advisor" element={
               <PrivateRoute>
                  <Layout>
                     <AIAdvisor />
                  </Layout>
               </PrivateRoute>
            } />
          </Routes>
        </FinanceProvider>
      </GroupProvider>
    </AuthProvider>
    </Router>
  );
}

export default App;
