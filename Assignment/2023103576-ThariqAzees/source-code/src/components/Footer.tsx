import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, Share2, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="font-bold text-base text-white">SkillBridge AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The AI-powered freelance marketplace connecting elite technical talent with high-impact client projects using smart matching and proposal generation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2">
              <li><Link href="/projects" className="hover:text-indigo-400 transition-colors">Browse Projects</Link></li>
              <li><Link href="/freelancers" className="hover:text-indigo-400 transition-colors">Find Top Freelancers</Link></li>
              <li><Link href="/projects/new" className="hover:text-indigo-400 transition-colors">Post a Project</Link></li>
              <li><Link href="/community" className="hover:text-indigo-400 transition-colors">Developer Community</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">AI Intelligence</h4>
            <ul className="space-y-2">
              <li><Link href="/profile/edit" className="hover:text-indigo-400 transition-colors">✨ AI Profile Enhancer</Link></li>
              <li><Link href="/projects" className="hover:text-indigo-400 transition-colors">✨ AI Skill Matcher</Link></li>
              <li><Link href="/assistant" className="hover:text-indigo-400 transition-colors">✨ AI Freelance Assistant</Link></li>
              <li><Link href="/community" className="hover:text-indigo-400 transition-colors">✨ AI Moderation Engine</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Connect & System</h4>
            <div className="flex space-x-3 mb-4">
              <a href="#" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <Share2 className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
            <p className="text-slate-500">
              Built with Next.js 14, TypeScript, Tailwind CSS, Supabase & OpenAI.
            </p>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} SkillBridge AI. All rights reserved.</p>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Powered by Next.js & Server-side AI Heuristics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
