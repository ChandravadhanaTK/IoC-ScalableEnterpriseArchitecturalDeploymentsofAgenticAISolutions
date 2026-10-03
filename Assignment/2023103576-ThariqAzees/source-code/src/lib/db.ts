import {
  INITIAL_USERS,
  INITIAL_PROFILES,
  INITIAL_PROJECTS,
  INITIAL_APPLICATIONS,
  INITIAL_POSTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SKILLS
} from './seed-data';
import { User, Profile, Project, Application, Post, Notification, AppStatus, PostStatus, ModerationVerdict, PortfolioProject } from './types';

// Global state in memory (resilient fallback)
let users: User[] = [...INITIAL_USERS];
let profiles: Record<string, Profile> = JSON.parse(JSON.stringify(INITIAL_PROFILES));
let projects: Project[] = [...INITIAL_PROJECTS];
let applications: Application[] = [...INITIAL_APPLICATIONS];
let posts: Post[] = [...INITIAL_POSTS];
let notifications: Notification[] = [...INITIAL_NOTIFICATIONS];
let skillsList: string[] = [...INITIAL_SKILLS];

// Helper delay to simulate DB latency
const delay = (ms = 50) => new Promise(res => setTimeout(res, ms));

export const db = {
  // Users
  users: {
    async findById(id: string): Promise<User | null> {
      await delay();
      return users.find(u => u.id === id) || null;
    },
    async findByEmail(email: string): Promise<User | null> {
      await delay();
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    async list(): Promise<User[]> {
      await delay();
      return [...users];
    },
    async create(data: Omit<User, 'id' | 'createdAt' | 'suspended'>): Promise<User> {
      await delay();
      const newUser: User = {
        ...data,
        id: `user-${Date.now()}`,
        suspended: false,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      
      // Auto create empty profile if freelancer
      if (data.role === 'FREELANCER') {
        profiles[newUser.id] = {
          id: `prof-${Date.now()}`,
          userId: newUser.id,
          headline: '',
          bio: '',
          skills: [],
          portfolio: [],
          updatedAt: new Date().toISOString()
        };
      }
      return newUser;
    },
    async setSuspended(id: string, suspended: boolean): Promise<User | null> {
      await delay();
      const user = users.find(u => u.id === id);
      if (user) {
        user.suspended = suspended;
      }
      return user || null;
    }
  },

  // Profiles
  profiles: {
    async findByUserId(userId: string): Promise<Profile | null> {
      await delay();
      const prof = profiles[userId];
      if (!prof) return null;
      const u = users.find(u => u.id === userId);
      return { ...prof, user: u };
    },
    async listFreelancers(search?: string, skillFilter?: string): Promise<Profile[]> {
      await delay();
      const freelancerUsers = users.filter(u => u.role === 'FREELANCER' && !u.suspended);
      let list = freelancerUsers.map(u => {
        const prof = profiles[u.id] || {
          id: `prof-${u.id}`,
          userId: u.id,
          updatedAt: new Date().toISOString()
        };
        return { ...prof, user: u };
      });

      if (skillFilter) {
        list = list.filter(p => p.skills?.some(s => s.toLowerCase() === skillFilter.toLowerCase()));
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          p.user?.name.toLowerCase().includes(q) ||
          p.headline?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.skills?.some(s => s.toLowerCase().includes(q))
        );
      }

      return list;
    },
    async update(userId: string, data: Partial<Profile>): Promise<Profile> {
      await delay();
      const existing = profiles[userId] || {
        id: `prof-${Date.now()}`,
        userId,
        updatedAt: new Date().toISOString()
      };
      const updated: Profile = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      };
      profiles[userId] = updated;
      return updated;
    },
    async addPortfolioItem(userId: string, item: Omit<PortfolioProject, 'id' | 'profileId'>): Promise<PortfolioProject> {
      await delay();
      const prof = profiles[userId] || {
        id: `prof-${Date.now()}`,
        userId,
        updatedAt: new Date().toISOString()
      };
      const newItem: PortfolioProject = {
        ...item,
        id: `port-${Date.now()}`,
        profileId: prof.id
      };
      prof.portfolio = [...(prof.portfolio || []), newItem];
      profiles[userId] = prof;
      return newItem;
    },
    async removePortfolioItem(userId: string, itemId: string): Promise<boolean> {
      await delay();
      const prof = profiles[userId];
      if (!prof || !prof.portfolio) return false;
      prof.portfolio = prof.portfolio.filter(p => p.id !== itemId);
      profiles[userId] = prof;
      return true;
    }
  },

  // Projects
  projects: {
    async list(filters?: { search?: string; skill?: string; level?: string; minBudget?: number }): Promise<Project[]> {
      await delay();
      let res = [...projects];
      if (filters?.skill) {
        res = res.filter(p => p.skills.some(s => s.toLowerCase() === filters.skill?.toLowerCase()));
      }
      if (filters?.level) {
        res = res.filter(p => p.experienceLevel === filters.level);
      }
      if (filters?.minBudget) {
        res = res.filter(p => p.budgetMax >= (filters.minBudget || 0));
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        res = res.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }
      // Populate client info
      return res.map(p => ({
        ...p,
        client: users.find(u => u.id === p.clientId)
      }));
    },
    async findById(id: string): Promise<Project | null> {
      await delay();
      const p = projects.find(proj => proj.id === id);
      if (!p) return null;
      return {
        ...p,
        client: users.find(u => u.id === p.clientId),
        applicationsCount: applications.filter(a => a.projectId === p.id).length
      };
    },
    async findByClientId(clientId: string): Promise<Project[]> {
      await delay();
      return projects.filter(p => p.clientId === clientId).map(p => ({
        ...p,
        client: users.find(u => u.id === p.clientId),
        applicationsCount: applications.filter(a => a.projectId === p.id).length
      }));
    },
    async create(data: Omit<Project, 'id' | 'createdAt' | 'applicationsCount' | 'status'>): Promise<Project> {
      await delay();
      const newProj: Project = {
        ...data,
        id: `proj-${Date.now()}`,
        status: 'OPEN',
        createdAt: new Date().toISOString()
      };
      projects.unshift(newProj);
      return newProj;
    },
    async update(id: string, clientId: string, data: Partial<Project>): Promise<Project | null> {
      await delay();
      const idx = projects.findIndex(p => p.id === id && p.clientId === clientId);
      if (idx === -1) return null;
      projects[idx] = { ...projects[idx], ...data };
      return projects[idx];
    },
    async delete(id: string, clientId: string): Promise<boolean> {
      await delay();
      const idx = projects.findIndex(p => p.id === id && p.clientId === clientId);
      if (idx === -1) return false;
      projects.splice(idx, 1);
      return true;
    }
  },

  // Applications
  applications: {
    async create(data: Omit<Application, 'id' | 'createdAt' | 'status'>): Promise<Application> {
      await delay();
      const newApp: Application = {
        ...data,
        id: `app-${Date.now()}`,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString()
      };
      applications.unshift(newApp);

      // Create notification for client
      const proj = projects.find(p => p.id === data.projectId);
      const freelancer = users.find(u => u.id === data.freelancerId);
      if (proj) {
        notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: proj.clientId,
          type: 'new_application',
          message: `${freelancer?.name || 'A freelancer'} submitted a proposal for "${proj.title}"`,
          link: `/projects/${proj.id}/applications`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      return newApp;
    },
    async findByFreelancerId(freelancerId: string): Promise<Application[]> {
      await delay();
      return applications
        .filter(a => a.freelancerId === freelancerId)
        .map(a => {
          const proj = projects.find(p => p.id === a.projectId);
          return {
            ...a,
            project: proj ? { ...proj, client: users.find(u => u.id === proj.clientId) } : undefined
          };
        });
    },
    async findByProjectId(projectId: string): Promise<Application[]> {
      await delay();
      return applications
        .filter(a => a.projectId === projectId)
        .map(a => {
          const u = users.find(user => user.id === a.freelancerId);
          const prof = profiles[a.freelancerId];
          return {
            ...a,
            freelancer: u ? { ...u, profile: prof } : undefined
          };
        });
    },
    async updateStatus(id: string, status: AppStatus): Promise<Application | null> {
      await delay();
      const app = applications.find(a => a.id === id);
      if (!app) return null;
      app.status = status;

      // Notify freelancer
      const proj = projects.find(p => p.id === app.projectId);
      notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: app.freelancerId,
        type: 'application_status',
        message: `Your application for "${proj?.title || 'project'}" status changed to ${status}`,
        link: '/applications',
        read: false,
        createdAt: new Date().toISOString()
      });

      return app;
    }
  },

  // Posts & Moderation
  posts: {
    async list(category?: string): Promise<Post[]> {
      await delay();
      let res = posts.filter(p => p.status === 'PUBLISHED');
      if (category && category !== 'All') {
        res = res.filter(p => p.category === category);
      }
      return res.map(p => {
        const author = users.find(u => u.id === p.authorId);
        const prof = author ? profiles[author.id] : undefined;
        return {
          ...p,
          author: author ? { ...author, profile: prof } : undefined
        };
      });
    },
    async listAllForAdmin(): Promise<Post[]> {
      await delay();
      return posts.map(p => {
        const author = users.find(u => u.id === p.authorId);
        return {
          ...p,
          author: author ? { ...author, profile: profiles[author.id] } : undefined
        };
      });
    },
    async create(data: Omit<Post, 'id' | 'createdAt' | 'commentsCount' | 'likesCount'>): Promise<Post> {
      await delay();
      const newPost: Post = {
        ...data,
        id: `post-${Date.now()}`,
        createdAt: new Date().toISOString(),
        commentsCount: 0,
        likesCount: 0
      };
      posts.unshift(newPost);
      return newPost;
    },
    async delete(id: string, authorId: string, isAdmin = false): Promise<boolean> {
      await delay();
      const idx = posts.findIndex(p => p.id === id && (isAdmin || p.authorId === authorId));
      if (idx === -1) return false;
      posts.splice(idx, 1);
      return true;
    },
    async toggleLike(postId: string): Promise<Post | null> {
      await delay();
      const post = posts.find(p => p.id === postId);
      if (!post) return null;
      if (post.isLikedByCurrentUser) {
        post.isLikedByCurrentUser = false;
        post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
      } else {
        post.isLikedByCurrentUser = true;
        post.likesCount = (post.likesCount || 0) + 1;
      }
      return post;
    },
    async updateModeration(id: string, status: PostStatus, verdict: ModerationVerdict, reason?: string): Promise<Post | null> {
      await delay();
      const post = posts.find(p => p.id === id);
      if (!post) return null;
      post.status = status;
      post.moderation = { verdict, reason };
      return post;
    }
  },

  // Notifications
  notifications: {
    async listByUserId(userId: string): Promise<Notification[]> {
      await delay();
      return notifications.filter(n => n.userId === userId);
    },
    async markAsRead(id: string): Promise<boolean> {
      await delay();
      const n = notifications.find(notif => notif.id === id);
      if (n) n.read = true;
      return true;
    },
    async markAllAsRead(userId: string): Promise<boolean> {
      await delay();
      notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; });
      return true;
    }
  },

  // Skills
  skills: {
    async list(): Promise<string[]> {
      await delay();
      return [...skillsList];
    }
  }
};
