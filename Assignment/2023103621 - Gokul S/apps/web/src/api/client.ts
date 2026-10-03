import axios from 'axios';
import { User, Exercise, Workout, UnitPreference } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true
});

// Auth API
export const authApi = {
  register: async (data: any) => (await api.post('/auth/register', data)).data,
  login: async (data: any) => (await api.post('/auth/login', data)).data,
  logout: async () => (await api.post('/auth/logout')).data,
  getMe: async () => (await api.get('/auth/me')).data
};

// Exercises API
export const exercisesApi = {
  getExercises: async (search?: string, muscle?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (muscle) params.append('muscle', muscle);
    return (await api.get<{ exercises: Exercise[] }>(`/exercises?${params.toString()}`)).data;
  },
  createCustom: async (data: { name: string; muscle_group: string; equipment: string }) => {
    return (await api.post<{ exercise: Exercise }>('/exercises', data)).data;
  },
  getHistory: async (exerciseId: string) => {
    return (await api.get(`/exercises/${exerciseId}/history`)).data;
  }
};

// Workouts API
export const workoutsApi = {
  createWorkout: async (data: any) => (await api.post<{ workout: Workout }>('/workouts', data)).data,
  getMyHistory: async (page = 1, limit = 10) => (await api.get(`/workouts?page=${page}&limit=${limit}`)).data,
  getWorkoutDetail: async (id: string) => (await api.get(`/workouts/${id}`)).data,
  patchWorkout: async (id: string, data: any) => (await api.patch(`/workouts/${id}`, data)).data,
  deleteWorkout: async (id: string) => (await api.delete(`/workouts/${id}`)).data,
  getCalendarDates: async (month?: string) => {
    const q = month ? `?month=${month}` : '';
    return (await api.get(`/workouts/calendar/dates${q}`)).data;
  }
};

// Social & Profile API
export const socialApi = {
  getFeed: async (cursor?: string) => {
    const q = cursor ? `?cursor=${cursor}` : '';
    return (await api.get(`/feed${q}`)).data;
  },
  searchUsers: async (query?: string) => {
    const q = query ? `?search=${encodeURIComponent(query)}` : '';
    return (await api.get<{ users: User[] }>(`/users${q}`)).data;
  },
  getProfile: async (username: string) => (await api.get<{ user: User }>(`/users/${username}`)).data,
  getUserWorkouts: async (username: string) => (await api.get<{ workouts: Workout[] }>(`/users/${username}/workouts`)).data,
  followUser: async (id: string) => (await api.post(`/users/${id}/follow`)).data,
  unfollowUser: async (id: string) => (await api.delete(`/users/${id}/follow`)).data,
  likeWorkout: async (id: string) => (await api.post(`/workouts/${id}/like`)).data,
  unlikeWorkout: async (id: string) => (await api.delete(`/workouts/${id}/like`)).data
};

// User Profile API
export const usersApi = {
  updateProfile: async (data: {
    display_name?: string;
    bio?: string | null;
    avatar_url?: string | null;
    is_private?: boolean;
    unit_preference?: UnitPreference;
  }) => (await api.patch<{ user: User }>('/users/me', data)).data,
  getFollowers: async (id: string) => (await api.get<{ followers: User[] }>(`/users/${id}/followers`)).data,
  getFollowing: async (id: string) => (await api.get<{ following: User[] }>(`/users/${id}/following`)).data
};

export const coachApi = {
  chat: async (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    (await api.post<{ reply: string }>('/coach/chat', { messages })).data
};
