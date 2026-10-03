'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Project, Application, Post, Profile } from '@/lib/types';
import { calculateProjectMatch } from '@/lib/ai';
import {
  Sparkles,
  Briefcase,
  UserCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  Users,
  ShieldAlert,
  Bot
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, role, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [freelancerApps, setFreelancerApps] = useState<Application[]>([]);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    async function loadData() {
      if (!currentUser) return;
      
      const allProjects = await db.projects.list();
      const posts = await db.posts.list();
      setCommunityPosts(posts.slice(0, 3));

      if (role === 'FREELANCER') {
        const prof = await db.profiles.findByUserId(currentUser.id);
        setProfile(prof);
        const apps = await db.applications.findByFreelancerId(currentUser.id);
        setFreelancerApps(apps);

        // Filter top recommended projects
        if (prof) {
          const recs = allProjects.filter(p => {
            const match = calculateProjectMatch({
              freelancer: {
                skills: prof.skills || [],
                experienceLevel: prof.experienceLevel || 'INTERMEDIATE',
                portfolioTech: prof.portfolio?.flatMap(item => item.technologies) || []
              },
              project: { skills: p.skills, experienceLevel: p.experienceLevel, title: p.title }
            });
            return match.score >= 50;
          });
          setRecommendedProjects(recs.slice(0, 3));
        } else {
          setRecommendedProjects(allProjects.slice(0, 3));
        }
      } else if (role === 'CLIENT') {
        const myProjs = await db.projects.findByClientId(currentUser.id);
        setClientProjects(myProjs);
      }

      setLoading(false);
    }

    if (currentUser) {
      loadData();
    }
  }, [currentUser, role, isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p>Loading personalized dashboard...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Calculate Profile Completion %
  let profileCompletion = 20;
  if (profile?.headline) profileCompletion += 20;
  if (profile?.bio) profileCompletion += 20;
  if (profile?.skills && profile.skills.length > 0) profileCompletion += 20;
  if (profile?.portfolio && profile.portfolio.length > 0) profileCompletion += 20;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-400">
            Account Role: <span className="font-semibold text-indigo-400 uppercase">{role}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {role === 'FREELANCER' && (
            <Link
              href="/profile/edit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow flex items-center space-x-1.5"
            >
              <Sparkles className="h-4 w-4" />
              <span>✨ Enhance Profile</span>
            </Link>
          )}

          {role === 'CLIENT' && (
            <Link
              href="/projects/new"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow flex items-center space-x-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Link>
          )}
        </div>
      </div>

      {/* FREELANCER DASHBOARD VIEW */}
      {role === 'FREELANCER' && (
        <div className="space-y-8">
          
          {/* Completion & Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Profile Completion</span>
                <span className="text-indigo-400 font-bold">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {profileCompletion < 100 ? 'Use AI Profile Enhancer to reach 100% visibility.' : 'Your profile is fully optimized!'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-1">
              <span className="text-xs font-semibold text-slate-400">Submitted Applications</span>
              <div className="text-3xl font-extrabold text-white">{freelancerApps.length}</div>
              <p className="text-[11px] text-emerald-400 font-medium">
                {freelancerApps.filter(a => a.status === 'SHORTLISTED' || a.status === 'ACCEPTED').length} Shortlisted / Accepted
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-1">
              <span className="text-xs font-semibold text-slate-400">Hourly Rate</span>
              <div className="text-3xl font-extrabold text-emerald-400">${profile?.hourlyRate || 65}/hr</div>
              <p className="text-[11px] text-slate-400">Status: {profile?.availability || 'Available'}</p>
            </div>

          </div>

          {/* AI Recommended Projects */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <span>✨ AI Recommended Projects for You</span>
              </h3>
              <Link href="/projects" className="text-xs text-indigo-400 hover:underline">View All</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedProjects.map((p) => (
                <div key={p.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{p.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <span className="text-emerald-400 font-bold">${p.budgetMin}-${p.budgetMax}</span>
                    <Link href={`/projects/${p.id}`} className="text-indigo-400 hover:underline font-semibold text-[11px]">
                      Apply Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Applications & Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Applications */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-sm">Recent Applications</h3>
              {freelancerApps.length === 0 ? (
                <p className="text-xs text-slate-500">No applications submitted yet.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {freelancerApps.slice(0, 3).map((app) => (
                    <div key={app.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-200 font-medium truncate max-w-[180px]">{app.project?.title || 'Project'}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-sm">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Link href="/profile/edit" className="p-3 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 text-slate-200 font-medium">
                  ✨ AI Profile Enhancer
                </Link>
                <Link href="/assistant" className="p-3 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 text-slate-200 font-medium">
                  🤖 AI Career Assistant
                </Link>
                <Link href="/projects" className="p-3 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 text-slate-200 font-medium">
                  💼 Browse Marketplace
                </Link>
                <Link href="/community" className="p-3 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 text-slate-200 font-medium">
                  💬 Developer Forum
                </Link>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CLIENT DASHBOARD VIEW */}
      {role === 'CLIENT' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-1">
              <span className="text-xs font-semibold text-slate-400">Created Projects</span>
              <div className="text-3xl font-extrabold text-white">{clientProjects.length}</div>
              <p className="text-[11px] text-slate-400">Active postings on SkillBridge AI</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total Applications Received</span>
              <div className="text-3xl font-extrabold text-purple-400">
                {clientProjects.reduce((acc, p) => acc + (p.applicationsCount || 0), 0)}
              </div>
              <p className="text-[11px] text-purple-300">Ready for client review</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-center">
              <Link
                href="/projects/new"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-2xl text-center shadow flex items-center justify-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Post New Project</span>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Your Active Projects</h3>
            {clientProjects.length === 0 ? (
              <p className="text-xs text-slate-500">You haven't posted any projects yet.</p>
            ) : (
              <div className="space-y-4">
                {clientProjects.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.title}</h4>
                      <p className="text-slate-400 mt-0.5">${p.budgetMin} - ${p.budgetMax} • Deadline: {new Date(p.deadline).toLocaleDateString()}</p>
                    </div>
                    <Link
                      href={`/projects/${p.id}/applications`}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-center"
                    >
                      Review Applications ({p.applicationsCount || 0})
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ADMIN DASHBOARD VIEW */}
      {role === 'ADMIN' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-center">
          <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Admin Dashboard Controls</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Manage users, review flagged community posts, suspend abusive accounts, and audit site activity.
          </p>
          <Link
            href="/admin"
            className="inline-block px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow"
          >
            Go to Admin Control Panel
          </Link>
        </div>
      )}

    </div>
  );
}
