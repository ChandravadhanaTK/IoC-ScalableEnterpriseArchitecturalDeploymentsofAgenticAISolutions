import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { User } from '../types';
import { usersApi } from '../api/client';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  onSelectUser: (username: string) => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  onSelectUser
}) => {
  if (!isOpen) return null;

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        if (type === 'followers') {
          const res = await usersApi.getFollowers(userId);
          setUsersList(res.followers);
        } else {
          const res = await usersApi.getFollowing(userId);
          setUsersList(res.following);
        }
      } catch (err) {
        console.error('Failed to fetch follow list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12141c] border border-[#262a3a] rounded-3xl w-full max-w-md h-[70vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#262a3a]">
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2 capitalize">
            <Users className="w-5 h-5 text-cyan-400" />
            {type}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No {type} found.</div>
          ) : (
            usersList.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  onSelectUser(u.username);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 bg-[#181b26] hover:bg-[#202534] rounded-2xl border border-slate-800 cursor-pointer transition"
              >
                <img
                  src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                  alt={u.display_name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{u.display_name}</h4>
                  <p className="text-xs text-slate-400">@{u.username}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
