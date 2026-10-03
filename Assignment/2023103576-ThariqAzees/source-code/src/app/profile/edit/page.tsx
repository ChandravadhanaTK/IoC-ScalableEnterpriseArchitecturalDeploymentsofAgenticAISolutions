'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Profile, PortfolioProject } from '@/lib/types';
import { AIProfileEnhancerModal } from '@/components/AIProfileEnhancerModal';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Check,
  User,
  Wand2,
  DollarSign,
  Briefcase,
  Globe,
  Share2,
  AlertCircle
} from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Form Fields
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE');
  const [hourlyRate, setHourlyRate] = useState(65);
  const [availability, setAvailability] = useState('Full-time');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [links, setLinks] = useState({ github: '', linkedin: '', website: '' });

  // New Portfolio Item Form
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortTech, setNewPortTech] = useState('');

  useEffect(() => {
    async function load() {
      if (currentUser) {
        const p = await db.profiles.findByUserId(currentUser.id);
        if (p) {
          setProfile(p);
          setHeadline(p.headline || '');
          setBio(p.bio || '');
          setAvatarUrl(p.avatarUrl || '');
          setExperienceLevel(p.experienceLevel || 'INTERMEDIATE');
          setHourlyRate(p.hourlyRate || 65);
          setAvailability(p.availability || 'Full-time');
          setSkills(p.skills || []);
          if (p.links) {
            setLinks({
              github: p.links.github || '',
              linkedin: p.links.linkedin || '',
              website: p.links.website || ''
            });
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Please log in to edit profile</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p>Loading profile editor...</p>
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

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortTitle.trim() || !newPortDesc.trim()) return;
    const item = await db.profiles.addPortfolioItem(currentUser.id, {
      title: newPortTitle,
      description: newPortDesc,
      technologies: newPortTech.split(',').map(t => t.trim()).filter(Boolean)
    });
    const updated = await db.profiles.findByUserId(currentUser.id);
    if (updated) setProfile(updated);
    setNewPortTitle('');
    setNewPortDesc('');
    setNewPortTech('');
  };

  const handleRemovePortfolio = async (itemId: string) => {
    await db.profiles.removePortfolioItem(currentUser.id, itemId);
    const updated = await db.profiles.findByUserId(currentUser.id);
    if (updated) setProfile(updated);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await db.profiles.update(currentUser.id, {
      headline,
      bio,
      avatarUrl,
      experienceLevel,
      hourlyRate: Number(hourlyRate),
      availability,
      skills,
      links
    });
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAcceptAIEnhancements = (enhanced: { headline: string; bio: string; skills: string[] }) => {
    setHeadline(enhanced.headline);
    setBio(enhanced.bio);
    setSkills(enhanced.skills);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header with AI Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Edit Freelancer Profile</h1>
          <p className="text-xs text-slate-400">Keep your professional bio, skills, and portfolio work up to date</p>
        </div>
        
        <button
          onClick={() => setShowAIModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center space-x-2 animate-bounce hover:animate-none"
        >
          <Wand2 className="h-4 w-4" />
          <span>✨ Improve Profile with AI</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-8 text-xs">
        
        {/* Basic Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Basic Info</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer | React & Next.js Specialist"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Professional Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your background, core technical focus, past achievements, and client commitment..."
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="BEGINNER">BEGINNER (0-2 Yrs)</option>
                <option value="INTERMEDIATE">INTERMEDIATE (2-5 Yrs)</option>
                <option value="EXPERT">EXPERT (5+ Yrs)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Hourly Rate ($ USD)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Full-time">Full-time (40 hrs/wk)</option>
                <option value="Part-time">Part-time (20 hrs/wk)</option>
                <option value="Contract">Contract / Hourly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skills Tag Editor */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Skills & Tech Stack</h3>

          <div className="flex space-x-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g. PyTorch, Docker, Next.js"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
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

        {/* Social Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">GitHub URL</label>
              <input
                type="text"
                value={links.github}
                onChange={(e) => setLinks({ ...links, github: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={links.linkedin}
                onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Personal Website</label>
              <input
                type="text"
                value={links.website}
                onChange={(e) => setLinks({ ...links, website: e.target.value })}
                placeholder="https://myportfolio.dev"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Portfolio Projects</h3>

          {/* List Existing */}
          {profile?.portfolio && profile.portfolio.length > 0 && (
            <div className="space-y-3">
              {profile.portfolio.map((item) => (
                <div key={item.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <p className="text-slate-400 text-[11px]">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePortfolio(item.id)}
                    className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Portfolio Form */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-indigo-400 block">Add New Project</span>
            <input
              type="text"
              value={newPortTitle}
              onChange={(e) => setNewPortTitle(e.target.value)}
              placeholder="Project Title"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
            <textarea
              value={newPortDesc}
              onChange={(e) => setNewPortDesc(e.target.value)}
              placeholder="Brief description of impact and achievements..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
            <input
              type="text"
              value={newPortTech}
              onChange={(e) => setNewPortTech(e.target.value)}
              placeholder="Tech Stack (comma separated, e.g. React, Node.js)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
            <button
              type="button"
              onClick={handleAddPortfolio}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
            >
              Save Project to Portfolio
            </button>
          </div>
        </div>

        {/* Submit Save */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Profile</span>
          </button>
        </div>

      </form>

      {/* AI Enhancer Modal Component */}
      <AIProfileEnhancerModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        currentProfile={{
          headline,
          bio,
          skills,
          experienceLevel,
          portfolio: profile?.portfolio || []
        }}
        onAccept={handleAcceptAIEnhancements}
      />

    </div>
  );
}
