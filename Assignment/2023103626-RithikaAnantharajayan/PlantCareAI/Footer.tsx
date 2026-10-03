import React from 'react';
import { Sprout, ShieldCheck, Cpu, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-forest-600 flex items-center justify-center text-white">
                <Sprout className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">PlantCare AI</span>
            </div>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              An enterprise-grade, agentic AI plant care assistant engineered with React, TypeScript, Cloud Firestore, and Google Gemini API. Built for academic enterprise-architecture capstone.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Enterprise Capstone</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-forest-600" />
                <span>Gemini Agentic Workflow</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-forest-600" />
                <span>Cloud Firestore Isolated Store</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                <span>Zero-Trust Security Model</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Quick Navigation</h4>
            <div className="flex flex-col space-y-2 text-sm text-slate-600">
              <Link to="/dashboard" className="hover:text-forest-700 transition-colors">Dashboard</Link>
              <Link to="/plants" className="hover:text-forest-700 transition-colors">My Plants</Link>
              <Link to="/planner" className="hover:text-forest-700 transition-colors">Care Planner</Link>
              <Link to="/assistant" className="hover:text-forest-700 transition-colors">AI Assistant</Link>
              <Link to="/monitoring" className="hover:text-forest-700 transition-colors">Monitoring Telemetry</Link>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>� 2026 PlantCare AI. All rights reserved. Academic Enterprise Architecture Capstone.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-forest-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
