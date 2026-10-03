'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Profile } from '@/lib/types';
import { Search, Filter, DollarSign, Award, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Profile[]>([]);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const skills = await db.skills.list();
      setSkillsList(skills);
      const list = await db.profiles.listFreelancers();
      setFreelancers(list);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const list = await db.profiles.listFreelancers(search, selectedSkill);
    setFreelancers(list);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Find & Hire Top Technical Freelancers</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Browse verified engineers, AI architects, UI designers, and security researchers with AI-analyzed skill badges
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, title, or skills (e.g. Next.js, Python)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Skills</option>
            {skillsList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-lg transition-all"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Freelancer Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs">Searching freelancers...</p>
        </div>
      ) : freelancers.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-2">
          <p className="text-sm font-semibold">No freelancers matched your filter criteria.</p>
          <p className="text-xs">Try searching for broader skills or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((f) => (
            <div
              key={f.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
            >
              
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-800 border border-indigo-500/30 shrink-0">
                      {f.avatarUrl ? (
                        <img src={f.avatarUrl} alt={f.user?.name || 'Freelancer'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-indigo-600/30 flex items-center justify-center font-bold text-indigo-300">
                          {f.user?.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center space-x-1">
                        <span>{f.user?.name}</span>
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                      </h3>
                      <p className="text-xs text-indigo-300 line-clamp-1">{f.headline || 'Software Developer'}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {f.bio || 'Experienced software professional available for contract development.'}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(f.skills || []).slice(0, 4).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-[10px] font-medium">
                      {s}
                    </span>
                  ))}
                  {(f.skills?.length || 0) > 4 && (
                    <span className="text-[10px] text-slate-500 font-medium py-0.5">
                      +{(f.skills?.length || 0) - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Details & View Link */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-400">
                  {f.hourlyRate && (
                    <span className="font-bold text-emerald-400">${f.hourlyRate}/hr</span>
                  )}
                  {f.experienceLevel && (
                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] uppercase">
                      {f.experienceLevel}
                    </span>
                  )}
                </div>

                <Link
                  href={`/profile/${f.userId}`}
                  className="px-3.5 py-1.5 bg-slate-800 group-hover:bg-indigo-600 text-slate-200 group-hover:text-white font-medium rounded-xl transition-all flex items-center space-x-1 text-xs"
                >
                  <span>View Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
