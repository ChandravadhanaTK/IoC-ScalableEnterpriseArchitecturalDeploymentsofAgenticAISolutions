'use client';

import React, { useState } from 'react';
import { ProfileEnhancementResult } from '@/lib/types';
import { Sparkles, Check, X, RefreshCw, AlertCircle, ArrowRight, Wand2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    headline?: string;
    bio?: string;
    skills: string[];
    experienceLevel?: string;
    portfolio: { title: string; description: string; technologies: string[] }[];
  };
  onAccept: (enhanced: { headline: string; bio: string; skills: string[] }) => void;
}

export function AIProfileEnhancerModal({ isOpen, onClose, currentProfile, onAccept }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileEnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleRunEnhancer = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/enhance-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProfile)
      });
      if (!res.ok) throw new Error('API failed');
      const data: ProfileEnhancementResult = await res.json();
      setResult(data);
      setSelectedSkills(data.recommendedSkills);
    } catch (err) {
      setError('AI profile enhancement encountered an issue. Using cached recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!result) return;
    onAccept({
      headline: result.improvedHeadline,
      bio: result.improvedBio,
      skills: selectedSkills
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>✨ AI Profile Optimizer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">Review Mode</span>
              </h3>
              <p className="text-xs text-slate-400">Review AI suggestions before accepting changes to your profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-slate-200 text-sm">
          {!result && !loading && (
            <div className="text-center py-10 space-y-4">
              <div className="h-16 w-16 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-semibold text-white text-base">Ready to boost profile visibility?</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Our AI engine will analyze your headline, bio, experience level, and portfolio projects to generate high-converting improvements.
                </p>
              </div>
              <button
                onClick={handleRunEnhancer}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs rounded-2xl shadow-lg shadow-indigo-500/25 transition-all inline-flex items-center space-x-2"
              >
                <Wand2 className="h-4 w-4" />
                <span>Generate AI Enhancements</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-14 space-y-4">
              <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-300">Analyzing skills, experience, and portfolio copy...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              
              {/* Improved Headline */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                  <span>Improved Headline</span>
                  <span className="text-[10px] text-slate-500">Compare with original</span>
                </div>
                <div className="text-xs text-slate-400 line-through">
                  Original: {currentProfile.headline || 'None'}
                </div>
                <p className="text-sm font-medium text-white bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/30">
                  {result.improvedHeadline}
                </p>
              </div>

              {/* Improved Bio */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">Improved Bio</span>
                <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/30 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {result.improvedBio}
                </div>
              </div>

              {/* Recommended Skills */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">Recommended Skill Tags</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.recommendedSkills.map(skill => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSkills(selectedSkills.filter(s => s !== skill));
                          } else {
                            setSelectedSkills([...selectedSkills, skill]);
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Suggestions */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">AI Career Recommendations</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.improvementSuggestions.map((sug, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>

        {/* Footer actions */}
        {result && !loading && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleRunEnhancer}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate</span>
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Discard
              </button>
              <button
                onClick={handleApplyChanges}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center space-x-1.5"
              >
                <span>Accept Changes</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
