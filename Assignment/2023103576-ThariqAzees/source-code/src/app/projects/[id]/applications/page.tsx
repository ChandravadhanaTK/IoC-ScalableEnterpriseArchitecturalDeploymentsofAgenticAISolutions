'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Application, Project, AppStatus } from '@/lib/types';
import { Users, CheckCircle, XCircle, Star, ArrowLeft, ExternalLink, DollarSign, Clock } from 'lucide-react';

export default function ProjectApplicationsReviewPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const { currentUser, role } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (projectId) {
        const p = await db.projects.findById(projectId);
        setProject(p);
        const apps = await db.applications.findByProjectId(projectId);
        setApplications(apps);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  const handleStatusChange = async (appId: string, status: AppStatus) => {
    await db.applications.updateStatus(appId, status);
    const updated = await db.applications.findByProjectId(projectId);
    setApplications(updated);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p>Loading project applications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <Link href={`/projects/${projectId}`} className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Project</span>
      </Link>

      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Proposals</h1>
          <p className="text-xs text-slate-400">{project?.title}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full border border-indigo-500/30">
          {applications.length} Applicants
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-2">
          <p className="text-sm font-semibold">No applications submitted yet for this project.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600/30 font-bold text-indigo-300 flex items-center justify-center">
                    {app.freelancer?.name.charAt(0) || 'F'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center space-x-2">
                      <span>{app.freelancer?.name}</span>
                      <Link
                        href={`/profile/${app.freelancerId}`}
                        target="_blank"
                        className="text-indigo-400 hover:underline text-xs flex items-center space-x-0.5"
                      >
                        <span>Profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-400">{app.freelancer?.profile?.headline || 'Freelancer'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-400 text-sm block">${app.proposedPrice}</span>
                    <span className="text-slate-400 text-[10px]">{app.expectedDays} Days timeline</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                    app.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    app.status === 'SHORTLISTED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    app.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Proposal Text */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Submitted Proposal</span>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {app.proposal}
                </p>
              </div>

              {/* Client Status Action Controls */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleStatusChange(app.id, 'SHORTLISTED')}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl flex items-center space-x-1"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>Shortlist</span>
                </button>

                <button
                  onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Accept Proposal</span>
                </button>

                <button
                  onClick={() => handleStatusChange(app.id, 'REJECTED')}
                  className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center space-x-1"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
