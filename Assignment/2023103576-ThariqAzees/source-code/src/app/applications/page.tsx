'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Application } from '@/lib/types';
import { Briefcase, Clock, DollarSign, ExternalLink, ArrowRight } from 'lucide-react';

export default function FreelancerApplicationsPage() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (currentUser) {
        const apps = await db.applications.findByFreelancerId(currentUser.id);
        setApplications(apps);
      }
      setLoading(false);
    }
    load();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p>Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">My Submitted Applications</h1>
          <p className="text-xs text-slate-400">Track application status updates, client responses, and accepted proposals</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full border border-indigo-500/30">
          {applications.length} Submitted
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-4">
          <p className="text-sm font-semibold">You haven't applied to any projects yet.</p>
          <Link
            href="/projects"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    app.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    app.status === 'SHORTLISTED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    app.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                    'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    Status: {app.status}
                  </span>
                  <h3 className="font-bold text-white text-base mt-1.5">
                    <Link href={`/projects/${app.projectId}`} className="hover:text-indigo-300 transition-colors">
                      {app.project?.title || 'Project'}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-400">Client: {app.project?.client?.name || 'Client'}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-emerald-400">${app.proposedPrice}</div>
                  <div className="text-[10px] text-slate-400">{app.expectedDays} Days timeline</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {app.proposal}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <span>Submitted {new Date(app.createdAt).toLocaleDateString()}</span>
                <Link
                  href={`/projects/${app.projectId}`}
                  className="text-indigo-400 hover:underline flex items-center space-x-1 font-medium"
                >
                  <span>View Project</span>
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
