'use client';

import React, { useState } from 'react';
import { Project, Profile, User } from '@/lib/types';
import { Sparkles, Wand2, X, Send, RefreshCw, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  freelancerUser: User;
  freelancerProfile?: Profile | null;
  onSubmitProposal: (proposalText: string, price: number, days: number) => Promise<void>;
}

export function AIProposalModal({
  isOpen,
  onClose,
  project,
  freelancerUser,
  freelancerProfile,
  onSubmitProposal
}: Props) {
  const [proposalText, setProposalText] = useState('');
  const [proposedPrice, setProposedPrice] = useState(project.budgetMin);
  const [expectedDays, setExpectedDays] = useState(14);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');

  if (!isOpen) return null;

  const handleGenerateProposal = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.title,
          projectDescription: project.description,
          requiredSkills: project.skills,
          freelancerName: freelancerUser.name,
          freelancerSkills: freelancerProfile?.skills || [],
          experienceLevel: freelancerProfile?.experienceLevel,
          portfolio: freelancerProfile?.portfolio || []
        })
      });
      const data = await res.json();
      if (data.proposal) {
        setProposalText(data.proposal);
      }
    } catch (err) {
      console.error('Failed to generate proposal:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalText.trim()) return;
    setSubmitting(true);
    try {
      await onSubmitProposal(proposalText, proposedPrice, expectedDays);
      setStep('SUCCESS');
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Submit Project Application</span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">{project.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'SUCCESS' ? (
          <div className="py-12 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-white">Application Submitted!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your proposal and terms have been submitted to the client. You can track application status in your dashboard.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-slate-200 text-xs">
            
            {/* AI Generator Banner */}
            <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-white text-xs">AI Proposal Draft Assistant</h4>
                  <p className="text-[11px] text-indigo-300">Generate a custom proposal based on project requirements & your profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateProposal}
                disabled={generating}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shrink-0 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {generating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                <span>✨ Draft with AI</span>
              </button>
            </div>

            {/* Proposal Text */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Cover Letter / Proposal (Editable)
              </label>
              <textarea
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                placeholder="Explain why you are the ideal developer for this project, past experience, and proposed approach..."
                rows={7}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
                required
              />
            </div>

            {/* Terms (Price & Days) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Proposed Budget ($ USD)
                </label>
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                  min={100}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Client Budget: ${project.budgetMin} - ${project.budgetMax}
                </span>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Estimated Timeline (Days)
                </label>
                <input
                  type="number"
                  value={expectedDays}
                  onChange={(e) => setExpectedDays(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !proposalText.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 flex items-center space-x-2 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Submit Proposal</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
