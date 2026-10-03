import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  PieChart,
  Bot,
  Wallet,
  Menu,
  X,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from './Modal';
import { Button } from './Button';

interface LayoutProps {
  children: React.ReactNode;
  onResetData: () => void;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/analysis', label: 'Spending Analysis', icon: PieChart },
  { to: '/agent', label: 'Finance Agent', icon: Bot },
];

export function Layout({ children, onResetData }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-screen">
        <SidebarContent onReset={() => setResetConfirm(true)} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white border-r border-slate-200 h-full">
            <SidebarContent onReset={() => setResetConfirm(true)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-600 rounded-lg text-white">
              <Wallet size={18} />
            </div>
            <span className="font-bold text-slate-800">FinMate</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <ConfirmDialog
        open={resetConfirm}
        title="Reset demo data?"
        message="This will replace all your current transactions and budgets with the original sample dataset. This action cannot be undone."
        confirmLabel="Reset data"
        onConfirm={() => {
          onResetData();
          setResetConfirm(false);
        }}
        onCancel={() => setResetConfirm(false)}
        danger
      />
    </div>
  );
}

function SidebarContent({ onReset }: { onReset: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="p-2 bg-teal-600 rounded-xl text-white">
          <Wallet size={22} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">FinMate</h1>
          <p className="text-xs text-slate-400">Personal Finance</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <Button variant="ghost" size="sm" onClick={onReset} className="w-full text-slate-500">
          <RotateCcw size={16} />
          Reset demo data
        </Button>
        <p className="text-xs text-slate-400 mt-2 px-3">Data stored locally in your browser.</p>
      </div>
    </>
  );
}
