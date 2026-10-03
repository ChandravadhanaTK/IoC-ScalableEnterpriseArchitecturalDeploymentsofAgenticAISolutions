import {
  User,
  Issue,
  NotificationItem,
  AIClassificationResult,
  AdminStats,
  StudentStats,
  IssueCategory,
  IssuePriority,
  IssueStatus,
} from '../types';

const TOKEN_KEY = 'campusfix_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (payload: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      department: string;
      year: string;
    }) => request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

    login: (payload: { email: string; password: string }) =>
      request<{ token: string; user: User; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    adminLogin: (payload: { email: string; password: string }) =>
      request<{ token: string; user: User; message: string }>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getMe: () => request<{ user: User }>('/api/auth/me'),

    updateProfile: (payload: { name: string; email: string; department?: string; year?: string }) =>
      request<{ user: User; message: string }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  issues: {
    create: (payload: {
      title: string;
      description: string;
      category: IssueCategory;
      location: string;
      priority: IssuePriority;
      imageUrl?: string;
    }) =>
      request<{ issue: Issue; message: string }>('/api/issues', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getMyIssues: () => request<{ issues: Issue[] }>('/api/issues/my'),

    getMyStats: () => request<StudentStats>('/api/issues/my/stats'),

    getAllIssues: (filters?: { search?: string; category?: string; priority?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.status) params.append('status', filters.status);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ issues: Issue[] }>(`/api/issues/all${query}`);
    },

    getAdminStats: () =>
      request<{
        stats: AdminStats;
        categoryCounts: Record<string, number>;
        priorityCounts: Record<string, number>;
        statusCounts: Record<string, number>;
      }>('/api/issues/admin/stats'),

    getById: (id: string) => request<{ issue: Issue }>(`/api/issues/${id}`),

    track: (issueId: string) => request<{ issue: Issue }>(`/api/issues/track/${issueId}`),

    update: (
      id: string,
      payload: {
        status?: IssueStatus;
        assignedDepartment?: string;
        adminRemarks?: string;
      }
    ) =>
      request<{ issue: Issue; message: string }>(`/api/issues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
  },

  notifications: {
    getMyNotifications: () =>
      request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),

    markAsRead: (id: string) =>
      request<{ message: string }>(`/api/notifications/${id}/read`, {
        method: 'PUT',
      }),

    markAllAsRead: () =>
      request<{ message: string }>('/api/notifications/read-all', {
        method: 'PUT',
      }),
  },

  ai: {
    classify: (payload: { title: string; description: string; category?: string; priority?: string }) =>
      request<{ result: AIClassificationResult }>('/api/ai/classify', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
};
