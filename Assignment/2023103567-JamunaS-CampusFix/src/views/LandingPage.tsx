import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building,
  Users,
  AlertTriangle,
  Zap,
  BarChart3,
  Lock,
  ChevronRight,
  HelpCircle,
  FileCheck,
  Send,
  Layers,
  Wrench,
  BookOpen,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onTrackIssue: (issueId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onTrackIssue }) => {
  const { login, adminLogin } = useAuth();
  const [quickTrackId, setQuickTrackId] = useState('');
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      onTrackIssue(quickTrackId.trim().toUpperCase());
    }
  };

  const handle1ClickLogin = async (role: 'admin' | 'student1' | 'student2') => {
    try {
      setDemoLoading(role);
      if (role === 'admin') {
        await adminLogin('admin@campusfix.edu', 'AdminPassword123!');
        onNavigate('admin-dashboard');
      } else if (role === 'student1') {
        await login('alex.chen@campusfix.edu', 'StudentPass123!');
        onNavigate('student-dashboard');
      } else {
        await login('priya.patel@campusfix.edu', 'StudentPass123!');
        onNavigate('student-dashboard');
      }
    } catch (err) {
      console.error('Demo login failed:', err);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner: Instant Demo Accounts */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2 text-xs font-medium text-center shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Quick Demo Sandbox:
          </span>
          <span className="text-blue-100">Click to instantly test roles:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handle1ClickLogin('admin')}
              disabled={!!demoLoading}
              className="bg-white/20 hover:bg-white text-white hover:text-blue-900 px-2.5 py-0.5 rounded text-[11px] font-bold transition-all"
            >
              {demoLoading === 'admin' ? 'Logging in...' : '⚡ Login as Admin'}
            </button>
            <button
              onClick={() => handle1ClickLogin('student1')}
              disabled={!!demoLoading}
              className="bg-white/20 hover:bg-white text-white hover:text-blue-900 px-2.5 py-0.5 rounded text-[11px] font-bold transition-all"
            >
              {demoLoading === 'student1' ? 'Logging in...' : '⚡ Login as Alex (Student)'}
            </button>
            <button
              onClick={() => handle1ClickLogin('student2')}
              disabled={!!demoLoading}
              className="bg-white/20 hover:bg-white text-white hover:text-blue-900 px-2.5 py-0.5 rounded text-[11px] font-bold transition-all"
            >
              {demoLoading === 'student2' ? 'Logging in...' : '⚡ Login as Priya (Student)'}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-18 lg:pb-28 bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI-Assisted Campus Facility & Infrastructure Management</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Report Campus Issues Easily with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              CampusFix
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A frictionless platform for university students and administrators. Submit hostel, lab, classroom, and
            utility complaints with AI-powered automatic classification, real-time status tracking, and zero ID barrier.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('student-register')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <span>Register Student Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('student-login')}
              className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs transition-all"
            >
              Student Sign In
            </button>
            <button
              onClick={() => onNavigate('admin-login')}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-200 transition-all flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* Quick Issue Tracker Search */}
          <div className="mt-10 max-w-xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-sm">
            <form onSubmit={handleQuickTrack} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickTrackId}
                  onChange={(e) => setQuickTrackId(e.target.value)}
                  placeholder="Have an Issue ID? e.g. CF-2026-1001"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shrink-0"
              >
                Track Live
              </button>
            </form>
          </div>

          {/* Verified Zero-Barrier Guarantee */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              No Aadhaar or Gov ID Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              No OTP or Email Verification Bottleneck
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Instant Dashboard Access
            </span>
          </div>
        </div>
      </section>

      {/* Campus Statistics Section */}
      <section className="py-12 bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-blue-800/40 border border-blue-700/50">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-100 tracking-tight">96.4%</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">Resolution Rate</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-800/40 border border-blue-700/50">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-100 tracking-tight">&lt; 18h</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">Avg First Response</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-800/40 border border-blue-700/50">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-100 tracking-tight">11</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">Departments Connected</div>
            </div>
            <div className="p-4 rounded-xl bg-blue-800/40 border border-blue-700/50">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-100 tracking-tight">100%</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">Zero-Paper Audited</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Seamless Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              How CampusFix Resolves Deficiencies
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From report submission to final physical inspection in three transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Student Reports Defect</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Describe the defect in classroom, hostel, lab, or utilities. Our built-in Gemini AI automatically suggests the
                appropriate category, priority level, and campus maintenance department.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Admin Triages & Dispatches</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Campus Facility Administrators review reports on their unified dashboard, assign technicians, update
                statuses to "Assigned" or "In Progress", and log official action remarks.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Resolved with Full Audit Trail</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Students receive instant in-app alerts as work progresses. The complete lifecycle is recorded with
                timestamps, technician notes, and verifiable resolution confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Engineered for University Campuses
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every tool required to maintain clean, safe, and fully functional academic infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">AI-Assisted Triage</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understands natural language descriptions (e.g. water leaks, machine breakdowns) and auto-routes tickets to civil, electrical, or IT cells.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Real-Time Status Timelines</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interactive chronological history shows precisely who acknowledged the ticket, which crew was dispatched, and when parts were replaced.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Executive Admin Analytics</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Breakdown charts for Category, Priority, and Status distributions to identify recurring maintenance bottlenecks across campus blocks.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">Role-Based Security & JWT</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bcrypt password hashing, secure JSON Web Tokens, and strict role demarcation prevent unauthorized tampering with ticket states.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Building className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">11 Facility Categories</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Specialized coverage for Hostels, Classrooms, Laboratories, Libraries, Canteen, Transport, Electricity, Water, and Wi-Fi infrastructure.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Send className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">In-App Notification Feed</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students receive unread badge notifications immediately when administration updates tickets or adds inspection remarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Box */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="border border-blue-200 rounded-2xl bg-blue-50/50 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Verified Demo Accounts for Testing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Use these pre-configured credentials to evaluate both student submission and administrator resolution workflows:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px] block mb-2">
                  Campus Administrator Account
                </span>
                <div className="space-y-1 text-slate-700">
                  <p><strong>Email:</strong> admin@campusfix.edu</p>
                  <p><strong>Password:</strong> AdminPassword123!</p>
                  <p><strong>Role:</strong> Administrator</p>
                </div>
                <button
                  onClick={() => onNavigate('admin-login')}
                  className="mt-3 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
                >
                  Go to Admin Login
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block mb-2">
                  Student Account (Alex Chen)
                </span>
                <div className="space-y-1 text-slate-700">
                  <p><strong>Email:</strong> alex.chen@campusfix.edu</p>
                  <p><strong>Password:</strong> StudentPass123!</p>
                  <p><strong>Dept:</strong> Computer Science (3rd Year)</p>
                </div>
                <button
                  onClick={() => onNavigate('student-login')}
                  className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs"
                >
                  Go to Student Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2 text-white font-extrabold text-base">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>CampusFix</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                CampusFix is a unified college infrastructure issue tracking platform designed to streamline facility maintenance, student grievances, and safety repairs.
              </p>
            </div>

            <div>
              <h5 className="text-white font-semibold uppercase tracking-wider text-[11px] mb-3">Portals</h5>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('student-login')} className="hover:text-white">Student Sign In</button></li>
                <li><button onClick={() => onNavigate('student-register')} className="hover:text-white">Student Registration</button></li>
                <li><button onClick={() => onNavigate('admin-login')} className="hover:text-white">Admin Management Console</button></li>
                <li><button onClick={() => onNavigate('track-issue')} className="hover:text-white">Issue Tracking Portal</button></li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold uppercase tracking-wider text-[11px] mb-3">Facility Divisions</h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>Plumbing & Civil Maintenance</li>
                <li>Electrical Works Division</li>
                <li>Network & IT Infrastructure</li>
                <li>Sanitation & Housekeeping</li>
                <li>Hostel Administration Office</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 CampusFix – AI-Powered Campus Issue Management System. All rights reserved.</p>
            <p>Production Ready • MongoDB & Express • Zero External ID Barrier</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
