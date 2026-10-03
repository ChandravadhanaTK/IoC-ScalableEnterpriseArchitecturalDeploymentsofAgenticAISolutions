import React, { useState, useEffect } from 'react';
import { User as UserIcon, Flame, Dumbbell, Users, Lock, Globe, Settings, UserPlus, UserCheck } from 'lucide-react';
import { socialApi } from '../api/client';
import { User, Workout } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatWeight } from '../utils/units';
import { WorkoutCard } from '../components/WorkoutCard';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import { FollowListModal } from '../components/FollowListModal';

interface ProfilePageProps {
  targetUsername?: string;
  onOpenSettings?: () => void;
  onSelectUser?: (username: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  targetUsername,
  onOpenSettings,
  onSelectUser
}) => {
  const { user: currentUser } = useAuth();
  const unit = currentUser?.unit_preference || 'kg';

  const usernameToFetch = targetUsername || currentUser?.username;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Modal for followers/following
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);

  const fetchProfile = async () => {
    if (!usernameToFetch) return;
    setLoading(true);
    try {
      const [resUser, resWorkouts] = await Promise.all([
        socialApi.getProfile(usernameToFetch),
        socialApi.getUserWorkouts(usernameToFetch)
      ]);
      setProfileUser(resUser.user);
      setWorkouts(resWorkouts.workouts || []);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [usernameToFetch]);

  const handleToggleFollow = async () => {
    if (!profileUser || followLoading) return;
    setFollowLoading(true);

    try {
      if (profileUser.is_following) {
        await socialApi.unfollowUser(profileUser.id);
        setProfileUser((prev) =>
          prev
            ? {
                ...prev,
                is_following: false,
                followers_count: Math.max(0, (prev.followers_count || 1) - 1)
              }
            : null
        );
      } else {
        await socialApi.followUser(profileUser.id);
        setProfileUser((prev) =>
          prev
            ? {
                ...prev,
                is_following: true,
                followers_count: (prev.followers_count || 0) + 1
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12">
        <div className="glass-card rounded-3xl p-8 h-64 animate-pulse bg-slate-800/40" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-400">
        User profile not found.
      </div>
    );
  }

  const isMe = profileUser.is_me;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Profile Header Card */}
      <div className="glass-card rounded-3xl p-6 border border-[#262a3a] space-y-6 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
          {/* Avatar */}
          <img
            src={profileUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
            alt={profileUser.display_name}
            className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400/60 shadow-glow"
          />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="font-extrabold text-2xl text-slate-100">{profileUser.display_name}</h1>
                <p className="text-xs text-slate-400">@{profileUser.username}</p>
              </div>

              {/* Action Buttons: Follow or Settings */}
              {isMe ? (
                <button
                  onClick={onOpenSettings}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition mx-auto sm:mx-0"
                >
                  <Settings className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`px-5 py-2 text-xs font-extrabold rounded-xl transition shadow-glow flex items-center gap-1.5 mx-auto sm:mx-0 ${
                    profileUser.is_following
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                  }`}
                >
                  {profileUser.is_following ? (
                    <>
                      <UserCheck className="w-4 h-4" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Follow
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-xs text-slate-300 italic pt-1">{profileUser.bio}</p>
            )}

            {/* Privacy Badge */}
            <div className="pt-1 flex justify-center sm:justify-start">
              {profileUser.is_private ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Lock className="w-3 h-3" /> Private Account
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  <Globe className="w-3 h-3" /> Public Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 bg-[#12141c] p-4 rounded-2xl border border-slate-800 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> Streak
            </p>
            <p className="text-lg font-extrabold text-amber-400">{profileUser.streak || 0} d</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Workouts</p>
            <p className="text-lg font-extrabold text-slate-100">{profileUser.workout_count || 0}</p>
          </div>
          <button
            onClick={() => setFollowModalType('followers')}
            className="hover:opacity-80 transition"
          >
            <p className="text-[10px] uppercase font-bold text-slate-400">Followers</p>
            <p className="text-lg font-extrabold text-cyan-400">{profileUser.followers_count || 0}</p>
          </button>
          <button
            onClick={() => setFollowModalType('following')}
            className="hover:opacity-80 transition"
          >
            <p className="text-[10px] uppercase font-bold text-slate-400">Following</p>
            <p className="text-lg font-extrabold text-slate-100">{profileUser.following_count || 0}</p>
          </button>
        </div>

        {/* Lifetime Volume Banner */}
        <div className="flex justify-between items-center bg-cyan-950/30 px-4 py-3 rounded-2xl border border-cyan-500/20 text-xs">
          <span className="text-slate-300 font-medium">All-Time Volume Lifted</span>
          <span className="font-extrabold text-cyan-400 text-sm">
            {formatWeight(profileUser.total_volume_kg || 0, unit)}
          </span>
        </div>
      </div>

      {/* Workouts Feed Header */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg text-slate-100">
          {isMe ? 'My Logged Workouts' : `${profileUser.display_name}'s Shared Workouts`}
        </h3>

        {workouts.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center text-slate-400 text-xs border border-[#262a3a]">
            No public workouts logged by this user yet.
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onSelectWorkout={(workout) => setSelectedWorkout(workout)}
                onSelectUser={(un) => onSelectUser && onSelectUser(un)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Workout Detail Modal */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
      />

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={!!followModalType}
        onClose={() => setFollowModalType(null)}
        userId={profileUser.id}
        type={followModalType || 'followers'}
        onSelectUser={(un) => onSelectUser && onSelectUser(un)}
      />
    </div>
  );
};
