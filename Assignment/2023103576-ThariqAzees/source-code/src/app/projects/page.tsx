'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Project, Profile } from '@/lib/types';
import { calculateProjectMatch } from '@/lib/ai';
import { Search, Filter, Sparkles, Plus, DollarSign, Calendar, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

export default function ProjectsMarketplacePage() {
  const { currentUser, role } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [freelancerProfile, setFreelancerProfile] = useState<Profile | null>(null);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [minBudget, setMinBudget] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const skills = await db.skills.list();
      setSkillsList(skills);
      if (currentUser?.role === 'FREELANCER') {
        const prof = await db.profiles.findByUserId(currentUser.id);
        setFreelancerProfile(prof);
      }
      const list = await db.projects.list();
      setProjects(list);
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  const handleFilter = async () => {
    setLoading(true);
    const list = await db.projects.list({
      search,
      skill: selectedSkill,
      level: selectedLevel,
      minBudget
    });
    setProjects(list);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Project Marketplace</h1>
          <p className="text-xs sm:text-sm text-slate-400">Discover top engineering projects with real-time AI compatibility scores</p>
        </div>

        {role === 'CLIENT' && (
          <Link
            href="/projects/new"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-xl flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Project</span>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="relative md:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
              placeholder="Search title or description (e.g. Next.js, RAG pipeline)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Skills</option>
            {skillsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Experience Levels</option>
            <option value="BEGINNER">BEGINNER</option>
            <option value="INTERMEDIATE">INTERMEDIATE</option>
            <option value="EXPERT">EXPERT</option>
          </select>

        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Min Budget: ${minBudget}</span>
            <input
              type="range"
              min={0}
              max={10000}
              step={500}
              value={minBudget}
              onChange={(e) => setMinBudget(Number(e.target.value))}
              className="accent-indigo-500"
            />
          </div>

          <button
            onClick={handleFilter}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading open projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-2">
          <p className="text-sm font-semibold">No open projects match your criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            // Calculate AI match if logged in freelancer
            let matchResult = null;
            if (freelancerProfile) {
              matchResult = calculateProjectMatch({
                freelancer: {
                  skills: freelancerProfile.skills || [],
                  experienceLevel: freelancerProfile.experienceLevel || 'INTERMEDIATE',
                  portfolioTech: freelancerProfile.portfolio?.flatMap(p => p.technologies) || []
                },
                project: {
                  skills: project.skills,
                  experienceLevel: project.experienceLevel,
                  title: project.title
                }
              });
            }

            return (
              <div
                key={project.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl transition-all space-y-4"
              >
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        {project.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Posted by {project.client?.name || 'Client'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white hover:text-indigo-300 transition-colors">
                      <Link href={`/projects/${project.id}`}>{project.title}</Link>
                    </h2>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-emerald-400">
                      ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">Fixed Budget</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                {/* Required Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>

                {/* ✨ AI Recommendation Score Card (Priority 4) */}
                {matchResult && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-200">✨ Recommended for You</span>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-300 px-2.5 py-0.5 bg-indigo-600/30 rounded-full border border-indigo-400/30">
                        AI Compatibility: {matchResult.score}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1 pt-1">
                      <span className="text-[11px] text-indigo-400 font-semibold block">Why this matches:</span>
                      {matchResult.reasons.map((reason: string, idx: number) => (
                        <p key={idx} className="text-slate-300 flex items-center space-x-1.5">
                          <span>{reason}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4 text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                    </span>
                    <span>Level: <strong className="text-slate-200">{project.experienceLevel}</strong></span>
                  </div>

                  <Link
                    href={`/projects/${project.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow flex items-center space-x-1.5"
                  >
                    <span>View & Apply</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
