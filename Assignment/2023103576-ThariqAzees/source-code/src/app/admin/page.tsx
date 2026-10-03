'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { User, Project, Post, Application } from '@/lib/types';
import { ShieldAlert, Users, Briefcase, FileText, CheckCircle, XCircle, UserX, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminPage() {
  const { currentUser, role } = useAuth();
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/data');
        if (res.status === 403 || res.status === 401) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUsersList(data.users || []);
        setProjectsList(data.projects || []);
        setAllPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setForbidden(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [role]);

  if (forbidden || role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Admin Access Restricted</h2>
        <p className="text-xs text-slate-400">Access denied. You must be logged in as an Admin user to view this panel.</p>
        <Link href="/login" className="inline-block px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl">
          Log In as Admin
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-2" />
        <p>Loading Admin Control Panel...</p>
      </div>
    );
  }

  const flaggedPosts = allPosts.filter(p => p.status === 'PENDING_REVIEW' || p.moderation?.verdict === 'REVIEW');

  const handleApprovePost = async (postId: string) => {
    const res = await fetch('/api/admin/approve-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId })
    });
    if (res.ok) {
      const data = await res.json();
      setAllPosts(data.posts || []);
    }
  };

  const handleRemovePost = async (postId: string, authorId: string) => {
    const res = await fetch('/api/admin/remove-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, authorId })
    });
    if (res.ok) {
      const data = await res.json();
      setAllPosts(data.posts || []);
    }
  };

  const handleToggleSuspend = async (userId: string, currentSuspended: boolean) => {
    const res = await fetch('/api/admin/toggle-suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, suspended: !currentSuspended })
    });
    if (res.ok) {
      const data = await res.json();
      setUsersList(data.users || []);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">SkillBridge Admin Control Panel</h1>
          <p className="text-xs text-slate-400">Platform overview, user management, and AI content moderation queue</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 block">Total Users</span>
          <span className="text-2xl font-bold text-white">{usersList.length}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 block">Active Projects</span>
          <span className="text-2xl font-bold text-indigo-400">{projectsList.length}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 block">Community Posts</span>
          <span className="text-2xl font-bold text-purple-400">{allPosts.length}</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 block">Flagged for Review</span>
          <span className="text-2xl font-bold text-amber-400">{flaggedPosts.length}</span>
        </div>
      </div>

      {/* Flagged Posts Review Queue (Priority 12) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span>AI Moderation Flagged Queue</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {flaggedPosts.length} Pending
          </span>
        </div>

        {flaggedPosts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No posts currently flagged for review. All community content is safe!</p>
        ) : (
          <div className="space-y-4">
            {flaggedPosts.map((post) => (
              <div key={post.id} className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{post.author?.name || 'User'}</span>
                    <span className="text-[10px] text-slate-400">({post.category})</span>
                  </div>
                  <span className="text-amber-400 font-semibold text-[10px]">
                    Reason: {post.moderation?.reason || 'Flagged for review'}
                  </span>
                </div>

                <p className="text-xs text-slate-200 bg-slate-900 p-3 rounded-xl leading-relaxed">
                  {post.body}
                </p>

                <div className="flex items-center justify-end space-x-2 pt-1 text-xs">
                  <button
                    onClick={() => handleApprovePost(post.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center space-x-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve Post</span>
                  </button>

                  <button
                    onClick={() => handleRemovePost(post.id, post.authorId)}
                    className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-semibold rounded-xl flex items-center space-x-1"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Remove Post</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center space-x-2">
          <Users className="h-5 w-5 text-indigo-400" />
          <span>User Accounts & Suspensions</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-950/40">
                  <td className="p-3">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {u.suspended ? (
                      <span className="text-rose-400 font-semibold">SUSPENDED</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">ACTIVE</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleSuspend(u.id, u.suspended)}
                        className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                          u.suspended
                            ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600'
                            : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900 border border-rose-500/30'
                        }`}
                      >
                        {u.suspended ? 'Unsuspend' : 'Suspend User'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
