import { useMemo } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { AgentPage } from '@/pages/AgentPage';
import { useFinanceData } from '@/hooks/useFinanceData';
import { Card, EmptyState } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';

function App() {
  const {
    data,
    error,
    loaded,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    resetDemoData,
    setDataDirect,
  } = useFinanceData();

  const memoizedData = useMemo(() => data, [data]);

  if (!loaded || !memoizedData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout onResetData={resetDemoData}>
        {error && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        <Routes>
          <Route path="/" element={<Dashboard data={memoizedData} />} />
          <Route
            path="/transactions"
            element={
              <TransactionsPage
                data={memoizedData}
                onAdd={addTransaction}
                onEdit={updateTransaction}
                onDelete={deleteTransaction}
              />
            }
          />
          <Route
            path="/budgets"
            element={
              <BudgetsPage
                data={memoizedData}
                onAdd={addBudget}
                onEdit={updateBudget}
                onDelete={deleteBudget}
              />
            }
          />
          <Route path="/analysis" element={<AnalysisPage data={memoizedData} />} />
          <Route
            path="/agent"
            element={<AgentPage data={memoizedData} onUpdateData={setDataDirect} />}
          />
          <Route
            path="*"
            element={
              <Card>
                <EmptyState
                  icon={<AlertCircle size={48} />}
                  title="Page not found"
                  message="The page you're looking for doesn't exist."
                  action={<Button onClick={() => (window.location.hash = '#/')}>Go to Dashboard</Button>}
                />
              </Card>
            }
          />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
