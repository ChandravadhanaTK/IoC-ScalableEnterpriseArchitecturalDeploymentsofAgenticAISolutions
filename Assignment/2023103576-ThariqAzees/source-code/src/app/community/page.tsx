'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Post, PostType, ModerationVerdict } from '@/lib/types';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Send,
  Plus,
  Trash2,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Web Development',
  'AI & ML',
  'UI/UX',
  'Design',
  'Content',
  'Marketing',
  'Data Science',
  'Cybersecurity',
  'Freelancing Advice'
];

const POST_TYPES: PostType[] = ['QUESTION', 'ADVICE', 'SHOWCASE', 'COLLABORATION', 'DISCUSSION'];

export default function CommunityPage() {
  const { currentUser, role } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // New Post State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postBody, setPostBody] = useState('');
  const [postCategory, setPostCategory] = useState('Web Development');
  const [postType, setPostType] = useState<PostType>('ADVICE');
  const [publishing, setPublishing] = useState(false);
  const [modNotice, setModNotice] = useState<{ verdict: ModerationVerdict; reason: string } | null>(null);

  useEffect(() => {
    async function load() {
      const list = await db.posts.list(selectedCategory);
      setPosts(list);
      setLoading(false);
    }
    load();
  }, [selectedCategory]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !postBody.trim()) return;
    setPublishing(true);
    setModNotice(null);

    // Call AI Moderation Endpoint (Priority 8)
    try {
      const modRes = await fetch('/api/ai/moderate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: postBody, category: postCategory })
      });
      const modData: { verdict: ModerationVerdict; reason: string } = await modRes.json();

      let postStatus: 'PUBLISHED' | 'PENDING_REVIEW' | 'REMOVED' = 'PUBLISHED';
      if (modData.verdict === 'REVIEW') {
        postStatus = 'PENDING_REVIEW';
      } else if (modData.verdict === 'BLOCK') {
        postStatus = 'REMOVED';
      }

      const created = await db.posts.create({
        authorId: currentUser.id,
        type: postType,
        category: postCategory,
        body: postBody,
        status: postStatus,
        moderation: modData
      });

      setModNotice(modData);

      if (postStatus === 'PUBLISHED') {
        const list = await db.posts.list(selectedCategory);
        setPosts(list);
        setPostBody('');
        setTimeout(() => setShowCreateModal(false), 2000);
      }
    } catch (err) {
      console.error('Moderation error:', err);
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    await db.posts.toggleLike(postId);
    const updated = await db.posts.list(selectedCategory);
    setPosts(updated);
  };

  const handleDeletePost = async (postId: string, authorId: string) => {
    if (!currentUser) return;
    const isOwnerOrAdmin = currentUser.id === authorId || role === 'ADMIN';
    if (!isOwnerOrAdmin) return;
    await db.posts.delete(postId, authorId, role === 'ADMIN');
    const updated = await db.posts.list(selectedCategory);
    setPosts(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Title & CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Freelancer & Developer Community</h1>
          <p className="text-xs sm:text-sm text-slate-400">Share advice, showcase work, and ask questions with automated AI content moderation</p>
        </div>

        {currentUser && (
          <button
            onClick={() => {
              setModNotice(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-xl flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Community Post</span>
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading community discussions...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-2">
          <p className="text-sm font-semibold">No community posts found in this category.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {posts.map((post) => {
            const isOwnerOrAdmin = currentUser?.id === post.authorId || role === 'ADMIN';

            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
              >
                {/* Author Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600/30 font-bold text-indigo-300 flex items-center justify-center">
                      {post.author?.name.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                        <span>{post.author?.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                          {post.type}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {post.category} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* AI Moderation Badge */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>AI Verified Safe</span>
                    </span>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleDeletePost(post.id, post.authorId)}
                        className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Body */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {post.body}
                </p>

                {/* Post Interactions */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                      post.isLikedByCurrentUser
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-slate-950 border-slate-800 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{post.likesCount || 0} Likes</span>
                  </button>

                  <span className="flex items-center space-x-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{post.commentsCount || 0} Comments</span>
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-400" />
                <span>Create Community Post</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {modNotice && (
              <div className={`p-3 rounded-2xl text-xs flex items-start space-x-2 ${
                modNotice.verdict === 'SAFE'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : modNotice.verdict === 'REVIEW'
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {modNotice.verdict === 'SAFE' ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                <div>
                  <span className="font-bold block">AI Moderation Verdict: {modNotice.verdict}</span>
                  <span>{modNotice.reason}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Post Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as PostType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    {POST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Post Content</label>
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  placeholder="Share developer advice, showcase a project, or open a technical discussion..."
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing || !postBody.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {publishing ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Publish Post</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
