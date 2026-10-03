'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Profile } from '@/lib/types';
import {
  User,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Globe,
  Edit,
  ExternalLink,
  Award,
  CheckCircle2,
  Share2
} from 'lucide-react';

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (userId) {
        const prof = await db.profiles.findByUserId(userId);
        setProfile(prof);
      }
      setLoading(false);
    }
    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p>Loading freelancer profile...</p>
      </div>
    );
  }

  if (!profile || !profile.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Profile Not Found</h2>
        <p className="text-xs text-slate-400">The freelancer profile you are looking for does not exist or has been removed.</p>
        <Link href="/freelancers" className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
          Browse Freelancers
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.userId;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center space-x-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl overflow-hidden bg-slate-800 border-2 border-indigo-500/30 shrink-0 shadow-lg">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                  {profile.user.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{profile.user.name}</h1>
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-indigo-300">
                {profile.headline || 'Freelance Tech Specialist'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                {profile.hourlyRate && (
                  <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>${profile.hourlyRate}/hr</span>
                  </span>
                )}
                {profile.experienceLevel && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    <span className="capitalize">{profile.experienceLevel.toLowerCase()}</span>
                  </span>
                )}
                {profile.availability && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{profile.availability}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile CTA or Contact CTA */}
          <div>
            {isOwnProfile ? (
              <Link
                href="/profile/edit"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold rounded-2xl shadow-lg flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit & AI Enhance Profile</span>
              </Link>
            ) : (
              <Link
                href={`/projects`}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-2xl shadow-lg flex items-center space-x-2"
              >
                <Briefcase className="h-4 w-4" />
                <span>Invite to Project</span>
              </Link>
            )}
          </div>

        </div>

      </div>

      {/* Main Grid: Bio, Skills & Portfolio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Bio & Portfolio */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Bio Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <User className="h-4 w-4 text-indigo-400" />
              <span>About Freelancer</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio || 'No biography written yet.'}
            </p>
          </div>

          {/* Portfolio Projects */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-indigo-400" />
              <span>Featured Portfolio Projects</span>
            </h3>

            {(!profile.portfolio || profile.portfolio.length === 0) ? (
              <p className="text-xs text-slate-500 py-4">No portfolio projects listed yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.portfolio.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
                        >
                          <span>Live Link</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">{item.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.technologies.map(tech => (
                        <span key={tech} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[10px] font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Sidebar: Skills & Links */}
        <div className="space-y-6">
          
          {/* Skills */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-3">
            <h3 className="text-base font-bold text-white">Skills & Competencies</h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map(s => (
                  <span key={s} className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium">
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500">No skills listed.</p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-3">
            <h3 className="text-base font-bold text-white">Social & Links</h3>
            <div className="space-y-2 text-xs">
              {profile.links?.github && (
                <a href={profile.links.github} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-slate-300 hover:text-indigo-400 p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <Share2 className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{profile.links.github}</span>
                </a>
              )}
              {profile.links?.linkedin && (
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-slate-300 hover:text-indigo-400 p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <Share2 className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{profile.links.linkedin}</span>
                </a>
              )}
              {profile.links?.website && (
                <a href={profile.links.website} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-slate-300 hover:text-indigo-400 p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{profile.links.website}</span>
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
