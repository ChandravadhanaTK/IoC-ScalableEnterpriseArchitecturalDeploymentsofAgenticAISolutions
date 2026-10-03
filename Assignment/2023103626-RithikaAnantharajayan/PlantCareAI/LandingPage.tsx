import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Bot, 
  CalendarClock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Plane, 
  Activity,
  HeartPulse
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, loginDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleDemoStart = async () => {
    await loginDemoUser();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-50/50 via-slate-50 to-white flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-forest-600" />
              <span>Next-Gen Agentic Plant Care Platform</span>
            </div>

            {/* Logo & Headline */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-forest-600 flex items-center justify-center text-white shadow-soft-lg">
                <Sprout className="w-8 h-8" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                PlantCare <span className="text-forest-600">AI</span>
              </h1>
            </div>

            {/* Tagline specified by requirement */}
            <p className="text-xl sm:text-2xl font-medium text-forest-800 tracking-tight">
              "Your intelligent companion for healthier, happier plants."
            </p>

            <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Empower your green space with proactive care tracking, automated watering schedules, vacation survival plans, and an autonomous AI agent that reasons about your plants� exact biological needs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-soft hover:shadow-soft-lg transition-all"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-xl shadow-soft hover:shadow-soft-lg transition-all"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={handleDemoStart}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-forest-800 bg-forest-100 hover:bg-forest-200/80 rounded-xl transition-all border border-forest-200"
                  >
                    <Sparkles className="w-4 h-4 text-forest-600" />
                    <span>Instant 1-Click Demo</span>
                  </button>

                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Capstone Badge */}
            <p className="text-xs text-slate-400 font-medium">
              Academic Enterprise Architecture Capstone � Built with React, TypeScript & Cloud Firestore
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Engineered for Thriving Botanical Health
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Combining autonomous AI reasoning with structured plant maintenance schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-forest-50/50 border border-forest-100 hover:border-forest-200 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center mb-4 shadow-soft">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Agentic AI Assistant</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Executes multi-step reasoning tools (`getUserPlants`, `createVacationPlan`, `updateCareTask`) and requests human approval before making schedule modifications.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-forest-50/50 border border-forest-100 hover:border-forest-200 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center mb-4 shadow-soft">
                <CalendarClock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Proactive Care Planner</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Chronologically groups tasks into Today, Tomorrow, and Next 3 Days. Marking a plant watered automatically recalibrates future cycles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-forest-50/50 border border-forest-100 hover:border-forest-200 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center mb-4 shadow-soft">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vacation Survival Plans</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Traveling? Tell the agent how long you will be away. It scans transpiration rates and schedules pre-departure hydration and post-return soil inspections.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-forest-50/50 border border-forest-100 hover:border-forest-200 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center mb-4 shadow-soft">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Cautious Botanical Diagnostics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Yellow or curling leaves? Receive evidence-based checks without misleading certainty, safeguarding root health and environmental factors.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-forest-50/50 border border-forest-100 hover:border-forest-200 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center mb-4 shadow-soft">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enterprise Security Model</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Firebase Authentication paired with granular Cloud Firestore rules guarantees complete user-level data isolation.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-forest-50/50 border border-forest-100 hover:border-forest-200 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-forest-600 text-white flex items-center justify-center mb-4 shadow-soft">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Monitoring Telemetry</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track AI request latencies, tool execution volume, success rates, and live system health in an admin-grade observability dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demonstration Callout */}
      <section className="py-16 bg-forest-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to experience the Agentic Plant Care Assistant?
          </h2>
          <p className="text-forest-200 text-base max-w-2xl mx-auto">
            Test the agent with sample plants (Money Plant, Snake Plant, Aloe Vera, Tulsi) or add your own personal flora collection.
          </p>
          <div className="pt-2">
            <button
              onClick={handleDemoStart}
              className="px-8 py-4 bg-white text-forest-900 hover:bg-forest-50 font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-sm inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-forest-600" />
              <span>Launch Capstone Demo Environment</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
