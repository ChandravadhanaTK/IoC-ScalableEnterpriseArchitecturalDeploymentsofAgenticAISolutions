import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sprout, 
  LayoutDashboard, 
  CalendarClock, 
  History, 
  Bot, 
  Activity, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  Key
} from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey } from '../../config/gemini';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Plants', path: '/plants', icon: Sprout },
    { name: 'Care Planner', path: '/planner', icon: CalendarClock },
    { name: 'Care History', path: '/history', icon: History },
    { name: 'AI Assistant', path: '/assistant', icon: Bot, isAgentic: true },
    { name: 'Monitoring', path: '/monitoring', icon: Activity },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveKey = () => {
    setGeminiApiKey(apiKeyInput);
    setShowKeyModal(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform duration-200">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-forest-700 transition-colors">
                  PlantCare <span className="text-forest-600">AI</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider bg-forest-100 text-forest-800 px-1.5 py-0.5 rounded ml-2">
                  Agentic
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-forest-50 text-forest-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-forest-600' : 'text-slate-400'}`} />
                      <span>{link.name}</span>
                      {link.isAgentic && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-500"></span>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* User Profile / Auth Actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => setShowKeyModal(true)}
                    title="Configure Gemini API Key"
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-700 font-bold text-xs flex items-center justify-center border border-forest-200">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        {user.displayName || 'Plant Parent'}
                        {user.isDemoUser && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-normal">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 max-w-[120px] truncate">{user.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-sm transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              {user && (
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="p-2 text-slate-500 rounded-lg hover:bg-slate-100"
                >
                  <Key className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
            {user ? (
              <>
                <div className="py-2 px-3 border-b border-slate-100 mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{user.displayName}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                  {user.isDemoUser && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                      Demo User
                    </span>
                  )}
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        active
                          ? 'bg-forest-50 text-forest-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-forest-600' : 'text-slate-400'}`} />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 text-sm font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Gemini API Key In-App Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-forest-50 text-forest-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Gemini API Settings</h3>
                <p className="text-xs text-slate-500">Optional: Connect your live Gemini API key</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              PlantCare AI works immediately with its built-in agentic simulator. To connect directly to Google Gemini Flash, enter your key below:
            </p>

            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 font-mono mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setApiKeyInput('');
                  setGeminiApiKey('');
                  setShowKeyModal(false);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Clear Key
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-2 text-xs font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-sm"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
