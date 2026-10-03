import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, Users, Lock, Globe } from 'lucide-react';
import { socialApi } from '../api/client';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface SearchUsersPageProps {
  onSelectUser: (username: string) => void;
}

export const SearchUsersPage: React.FC<SearchUsersPageProps> = ({ onSelectUser }) => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await socialApi.searchUsers(search);
      setUsers(res.users);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" /> Search Community
        </h1>
        <p className="text-xs text-slate-400">Discover lifters, friends, and athletes to follow</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by username or display name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl glass-input text-sm"
        />
      </div>

      {/* User List Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-4 h-20 animate-pulse bg-slate-800/40" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center text-slate-400 text-xs border border-[#262a3a]">
          No users matching "{search}" were found.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectUser(u.username)}
              className="glass-card rounded-2xl p-4 border border-[#262a3a] hover:border-cyan-500/40 flex items-center justify-between cursor-pointer transition group"
            >
              <div className="flex items-center gap-3">
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                  alt={u.display_name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-800"
                />
                <div>
                  <h4 className="font-bold text-slate-100 group-hover:text-cyan-400 text-base transition">
                    {u.display_name}
                  </h4>
                  <p className="text-xs text-slate-400">@{u.username}</p>
                  {u.bio && <p className="text-xs text-slate-300 italic line-clamp-1 mt-0.5">{u.bio}</p>}
                </div>
              </div>

              <div className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20">
                View Profile →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
