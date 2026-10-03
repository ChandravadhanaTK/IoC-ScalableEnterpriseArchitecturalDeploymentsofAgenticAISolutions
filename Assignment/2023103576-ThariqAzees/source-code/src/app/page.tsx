'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  UserCheck,
  Briefcase,
  FileText,
  Star,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-slate-950">
      
      {/* Glow Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-inner">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span>Next-Generation AI Freelance Ecosystem</span>
          <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Connect Top Engineering Talent with Clients using{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            AI Intelligence
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          SkillBridge AI enhances freelancer profiles, matches client requirements with 94%+ compatibility scores, generates custom proposals, and moderates tech community discussions.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/projects"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 group"
          >
            <Briefcase className="h-4 w-4" />
            <span>Explore Marketplace</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/profile/edit"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Improve Profile with AI</span>
          </Link>
        </div>

        {/* Core Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md max-w-4xl mx-auto text-left">
          <div>
            <div className="text-2xl font-bold text-white">94%</div>
            <div className="text-xs text-slate-400">Average AI Match Precision</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-400">&lt; 30s</div>
            <div className="text-xs text-slate-400">Proposal Generation</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">100%</div>
            <div className="text-xs text-slate-400">Server-Side Resilient AI</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">$85/hr</div>
            <div className="text-xs text-slate-400">Avg Freelancer Rate</div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO PREVIEW CARD */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="p-1 rounded-3xl bg-gradient-to-b from-indigo-500/30 via-purple-500/20 to-slate-800/40 shadow-2xl">
          <div className="bg-slate-900 rounded-[22px] p-6 sm:p-8 border border-slate-800/80">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                  AI
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">✨ AI Match & Compatibility Engine</h3>
                  <p className="text-xs text-slate-400">Real-time skill graph & portfolio verification</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1">
                <Zap className="h-3.5 w-3.5" />
                <span>94% Compatibility Match</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Matched Freelancer Profile</span>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center">
                    PS
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Priya Sharma</h4>
                    <p className="text-xs text-slate-400">Senior Full Stack Engineer</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'].map(s => (
                    <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[11px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Why this project matches</span>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>✓ Next.js & React directly match client requirements</span>
                  </li>
                  <li className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>✓ TypeScript matches project experience level (EXPERT)</span>
                  </li>
                  <li className="flex items-center space-x-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>✓ Similar portfolio SaaS analytics project work</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-20 bg-slate-900/40 border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Built for modern tech teams & elite freelancers</h2>
            <p className="mt-3 text-sm text-slate-400">Everything you need to hire, pitch, and collaborate with zero friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-white">✨ AI Profile Optimizer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transforms plain bios into compelling client-facing headlines, recommends missing high-value tech tags, and provides actionable suggestions with a full review UI.
              </p>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-white">✨ One-Click AI Proposals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates customized, client-focused proposals tailored to specific project requirements and freelancer past experience. Complete with live text editing.
              </p>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 hover:border-pink-500/40 transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-white">✨ AI Moderated Community</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keeps discussions clean and high-quality. Real-time safety scanning blocks spam links while routing borderline posts to admin review.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA FOOTER BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900 border border-indigo-500/30 space-y-6">
          <h2 className="text-3xl font-extrabold text-white">Ready to experience AI-powered freelancing?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Join SkillBridge AI today. Browse projects, test the AI proposal generator, or build your optimized developer profile.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
            >
              Create Account
            </Link>
            <Link
              href="/projects"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all"
            >
              Browse Open Projects
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
