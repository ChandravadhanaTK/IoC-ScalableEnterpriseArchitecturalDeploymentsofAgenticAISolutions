'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Project, Profile } from '@/lib/types';
import { AIProposalModal } from '@/components/AIProposalModal';
import { calculateProjectMatch } from '@/lib/ai';
import {
  Briefcase,
  DollarSign,
  Calendar,
  Award,
  Sparkles,
  Users,
  Send,
  Trash2,
  Edit,
  ArrowLeft,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const router = useRouter();
  const { currentUser, role } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    async function load() {
      if (projectId) {
        const p = await db.projects.findById(projectId);
        setProject(p);
        if (currentUser?.role === 'FREELANCER') {
          const prof = await db.profiles.findByUserId(currentUser.id);
          setFreelancerProfile(prof);
          const apps = await db.applications.findByFreelancerId(currentUser.id);
          if (apps.some(a => a.projectId === projectId)) {
            setHasApplied(true);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [projectId, currentUser]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Project Not Found</h2>
        <Link href="/projects" className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isClientOwner = currentUser?.id === project.clientId;

  const handleDelete = async () => {
    if (!currentUser || !confirm('Are you sure you want to delete this project?')) return;
    await db.projects.delete(project.id, currentUser.id);
    router.push('/projects');
  };

  const handleApply = async (proposalText: string, proposedPrice: number, expectedDays: number) => {
    if (!currentUser) return;
    await db.applications.create({
      projectId: project.id,
      freelancerId: currentUser.id,
      proposal: proposalText,
      proposedPrice,
      expectedDays
    });
    setHasApplied(true);
  };

  // AI Match
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button */}
      <Link href="/projects" className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Main Project Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              {project.status}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{project.title}</h1>
            <p className="text-xs text-slate-400">
              Client: <span className="text-slate-200 font-medium">{project.client?.name || 'Client'}</span> • Posted {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right shrink-0 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-xl font-extrabold text-emerald-400">
              ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">Fixed Price Budget</div>
          </div>
        </div>

        {/* Requirements breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block">Experience Required</span>
            <span className="font-semibold text-white">{project.experienceLevel}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Deadline</span>
            <span className="font-semibold text-white">{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Applications</span>
            <span className="font-semibold text-indigo-400">{project.applicationsCount || 0} Submitted</span>
          </div>
        </div>

        {/* AI Recommendation Box */}
        {matchResult && (
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-200">✨ AI Match Analysis</span>
              </div>
              <span className="text-xs font-extrabold text-indigo-300 px-2.5 py-0.5 bg-indigo-600/30 rounded-full border border-indigo-400/30">
                Compatibility: {matchResult.score}%
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1 pt-1">
              {matchResult.reasons.map((r: string, i: number) => (
                <p key={i} className="text-emerald-400 font-medium">{r}</p>
              ))}
            </div>
          </div>
        )}

        {/* Description Body */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Project Description</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* Skills Required */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {project.skills.map(s => (
              <span key={s} className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <div>
            {isClientOwner && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/projects/${project.id}/applications`}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>View Received Applications ({project.applicationsCount || 0})</span>
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs rounded-xl border border-rose-500/30 flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          <div>
            {!isClientOwner && role === 'FREELANCER' && (
              hasApplied ? (
                <span className="px-5 py-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-xl inline-flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Proposal Already Submitted</span>
                </span>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>✨ Apply with AI Proposal</span>
                </button>
              )
            )}
          </div>
        </div>

      </div>

      {/* AI Proposal Modal */}
      {currentUser && (
        <AIProposalModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          project={project}
          freelancerUser={currentUser}
          freelancerProfile={freelancerProfile}
          onSubmitProposal={handleApply}
        />
      )}

    </div>
  );
}
