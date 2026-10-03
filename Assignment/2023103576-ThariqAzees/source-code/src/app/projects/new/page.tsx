'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Briefcase, Plus, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function CreateProjectPage() {
  const router = useRouter();
  const { currentUser, role } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState(2000);
  const [budgetMax, setBudgetMax] = useState(5000);
  const [deadline, setDeadline] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [experienceLevel, setExperienceLevel] = useState('EXPERT');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'Next.js', 'TypeScript']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (role !== 'CLIENT' && role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Client Access Required</h2>
        <p className="text-xs text-slate-400">You must be logged in with a Client account to post new projects.</p>
      </div>
    );
  }

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setError(null);
    try {
      const proj = await db.projects.create({
        clientId: currentUser.id,
        title,
        description,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        deadline: new Date(deadline).toISOString(),
        experienceLevel,
        skills
      });
      router.push(`/projects/${proj.id}`);
    } catch (err) {
      setError('Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Post a New Project</h1>
        <p className="text-xs text-slate-400">Create a high-impact project brief to match with top freelancers</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-xs">
        
        <div>
          <label className="block text-slate-300 font-medium mb-1">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Next.js 14 SaaS Dashboard with Supabase & Tailwind"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 text-sm font-medium"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Detailed Description & Deliverables</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify project requirements, architecture constraints, API integrations, and key milestones..."
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
            required
          />
        </div>

        {/* Skills Tag Input */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Required Skills</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g. PyTorch, GraphQL, AWS"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl font-medium flex items-center space-x-2">
                <span>{s}</span>
                <button type="button" onClick={() => handleRemoveSkill(s)} className="text-indigo-400 hover:text-rose-400">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Minimum Budget ($ USD)</label>
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(Number(e.target.value))}
              min={100}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Maximum Budget ($ USD)</label>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              min={100}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Experience Level Required</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
            >
              <option value="BEGINNER">BEGINNER</option>
              <option value="INTERMEDIATE">INTERMEDIATE</option>
              <option value="EXPERT">EXPERT</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Project Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              required
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-xl flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Publish Project</span>
          </button>
        </div>

      </form>

    </div>
  );
}
