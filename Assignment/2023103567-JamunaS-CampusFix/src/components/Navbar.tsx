import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  ShieldAlert,
  Building,
  PlusCircle,
  ListFilter,
  Search,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenReportModal?: () => void;
  onSelectTrackIssue?: (issueId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenReportModal,
  onSelectTrackIssue,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav(user ? (user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard') : 'landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Campus<span className="text-blue-600">Fix</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Campus Issue Management</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <button
                  onClick={() => handleNav('landing')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'landing' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNav('track-issue')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'track-issue' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  Track Issue
                </button>
                <button
                  onClick={() => handleNav('student-login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition-colors"
                >
                  Student Portal
                </button>
                <button
                  onClick={() => handleNav('admin-login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  Admin Login
                </button>
                <button
                  onClick={() => handleNav('student-register')}
                  className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
                >
                  Register Student
                </button>
              </>
            ) : user.role === 'admin' ? (
              <>
                <button
                  onClick={() => handleNav('admin-dashboard')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </button>
                <button
                  onClick={() => handleNav('admin-issues')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-issues' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  Issue Management
                </button>
                <button
                  onClick={() => handleNav('admin-profile')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-profile' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNav('student-dashboard')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'student-dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => handleNav('track-issue')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'track-issue' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Track Issues
                </button>
                <button
                  onClick={() => handleNav('student-profile')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView === 'student-profile' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                {onOpenReportModal && (
                  <button
                    onClick={onOpenReportModal}
                    className="ml-1 px-3.5 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Report Issue
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User Status / Notification & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <>
                <NotificationDropdown onSelectIssue={onSelectTrackIssue} />

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{user.role} • {user.department ? user.department.split('&')[0] : ''}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      handleNav('landing');
                    }}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationDropdown onSelectIssue={onSelectTrackIssue} />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {!user ? (
            <div className="space-y-2">
              <button
                onClick={() => handleNav('landing')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={() => handleNav('track-issue')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 rounded-lg"
              >
                Track Issue by ID
              </button>
              <button
                onClick={() => handleNav('student-login')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 rounded-lg"
              >
                Student Login
              </button>
              <button
                onClick={() => handleNav('student-register')}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg"
              >
                Register Student Account
              </button>
              <button
                onClick={() => handleNav('admin-login')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 rounded-lg"
              >
                Admin Console Login
              </button>
            </div>
          ) : user.role === 'admin' ? (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-blue-50 rounded-lg mb-2">
                <p className="text-xs font-bold text-blue-900">{user.name}</p>
                <p className="text-[10px] text-blue-700">Administrator</p>
              </div>
              <button
                onClick={() => handleNav('admin-dashboard')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Dashboard Overview
              </button>
              <button
                onClick={() => handleNav('admin-issues')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Manage All Issues
              </button>
              <button
                onClick={() => handleNav('admin-profile')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Admin Profile
              </button>
              <button
                onClick={() => {
                  logout();
                  handleNav('landing');
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-blue-50 rounded-lg mb-2">
                <p className="text-xs font-bold text-blue-900">{user.name}</p>
                <p className="text-[10px] text-blue-700">{user.department} ({user.year})</p>
              </div>
              {onOpenReportModal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenReportModal();
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  + Report New Issue
                </button>
              )}
              <button
                onClick={() => handleNav('student-dashboard')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Student Dashboard
              </button>
              <button
                onClick={() => handleNav('track-issue')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Track Campus Issues
              </button>
              <button
                onClick={() => handleNav('student-profile')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Student Profile
              </button>
              <button
                onClick={() => {
                  logout();
                  handleNav('landing');
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
