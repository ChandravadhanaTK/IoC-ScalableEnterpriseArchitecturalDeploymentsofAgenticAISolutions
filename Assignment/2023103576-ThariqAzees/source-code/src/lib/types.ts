export type Role = 'FREELANCER' | 'CLIENT' | 'ADMIN';
export type AppStatus = 'SUBMITTED' | 'VIEWED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
export type ModerationVerdict = 'SAFE' | 'REVIEW' | 'BLOCK';
export type PostStatus = 'PUBLISHED' | 'PENDING_REVIEW' | 'REMOVED';
export type PostType = 'QUESTION' | 'ADVICE' | 'SHOWCASE' | 'COLLABORATION' | 'DISCUSSION';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: Role;
  suspended: boolean;
  createdAt: string;
}

export interface PortfolioProject {
  id: string;
  profileId: string;
  title: string;
  description: string;
  technologies: string[];
  url?: string | null;
  imageUrl?: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  experienceLevel?: string | null; // 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'
  hourlyRate?: number | null;
  availability?: string | null; // 'Full-time' | 'Part-time' | 'Contract' | 'As needed'
  links?: Record<string, string> | null;
  updatedAt: string;
  portfolio?: PortfolioProject[];
  skills?: string[];
  user?: User;
}

export interface Skill {
  id: number;
  name: string;
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  experienceLevel: string; // 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'
  status: string; // 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
  createdAt: string;
  skills: string[];
  client?: User;
  applicationsCount?: number;
}

export interface Application {
  id: string;
  projectId: string;
  freelancerId: string;
  proposal: string;
  proposedPrice: number;
  expectedDays: number;
  status: AppStatus;
  createdAt: string;
  freelancer?: User & { profile?: Profile };
  project?: Project;
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  category: string;
  body: string;
  status: PostStatus;
  createdAt: string;
  author?: User & { profile?: Profile };
  commentsCount?: number;
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
  moderation?: {
    verdict: ModerationVerdict;
    reason?: string | null;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: User & { profile?: Profile };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface AiRecommendation {
  id: string;
  userId: string;
  projectId: string;
  score: number;
  reasons: string[];
  createdAt: string;
}

export interface ProfileEnhancementResult {
  improvedHeadline: string;
  improvedBio: string;
  recommendedSkills: string[];
  improvementSuggestions: string[];
}
