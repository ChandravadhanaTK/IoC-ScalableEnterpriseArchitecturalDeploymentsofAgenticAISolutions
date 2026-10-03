# SkillBridge AI — Single-Prompt Application Generation Blueprint

**Student Name:** Thariq Azees  
**Roll Number:** 2023103576  
**Course:** IoC — Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
**Project Name:** SkillBridge AI — Smart Freelance Marketplace & AI Agent Ecosystem  
**Repository URL:** [https://github.com/ThariqAzees/SkillBridgeAI](https://github.com/ThariqAzees/SkillBridgeAI)  
**Live Application URL:** [https://skill-bridge-ai-blush.vercel.app/it](https://skill-bridge-ai-blush.vercel.app/it)  

---

## Instructions for AI Assistant

You can pass the prompt below directly into an advanced LLM coding assistant (such as Antigravity, Claude 3.5 Sonnet, or GPT-4o) to reproduce the complete **SkillBridge AI** web application codebase from scratch.

---

```markdown
# PROMPT: Build SkillBridge AI — Production AI Freelance Marketplace & Agent Ecosystem

Build a complete, production-ready AI-powered freelance marketplace named **SkillBridge AI** using **Next.js 14 App Router (TypeScript)**, **Tailwind CSS**, **Prisma ORM (PostgreSQL)**, **Supabase Auth**, **Nodemailer SMTP**, and **OpenAI API**.

## 1. Application Requirements & Core Features

### A. Role-Based User System & Authentication
1. **Three User Roles**: `FREELANCER`, `CLIENT`, and `ADMIN`.
2. **Authentication**:
   - Supabase Auth integration alongside custom signed `sb_session_id` cookies (HMAC-SHA256).
   - Login, Signup, Logout, and Server-Side Role-Based Authorization helpers (`getAuthenticatedUserServer()`, `requireAdminServer()`).
   - Non-enumerating Password Reset via Nodemailer SMTP. Reset links must use 64-character high-entropy tokens (`crypto.randomBytes(32)`), stored as SHA-256 hashes in the `PasswordResetToken` database table, expiring after 15 minutes, with atomic single-use consumption and server-side Supabase Auth user password sync (`supabaseAdmin.auth.admin.updateUserById`).

### B. Freelancer Profile & Discovery Directory
- Full freelancer profile (`/profile/[id]` and `/profile/edit`) supporting headline, bio, skills, experience level, hourly rate, availability, portfolio projects, and links.
- Public Freelancer Directory (`/freelancers`) with keyword search and skill filtering.

### C. ✨ AI Profile Enhancer
- Server API (`/api/ai/enhance-profile`) using OpenAI GPT-4o-mini to optimize headline, bio, and suggested skills based on freelancer portfolio items.
- UI Modal (`AIProfileEnhancerModal.tsx`) showing a side-by-side diff review. User must explicitly click "Accept Changes" to apply edits.

### D. Client Project Marketplace & Applications
- Project creation (`/projects/new`), editing, deletion, and public browsing (`/projects`).
- Complete Proposal Application workflow (`SUBMITTED` → `VIEWED` → `SHORTLISTED` → `ACCEPTED` / `REJECTED`).

### E. ✨ AI Project Compatibility Matcher
- Server API (`/api/ai/match`) computing real-time compatibility scores (0-100%) and feature breakdown bullet points comparing freelancer profiles against project requirements.

### F. ✨ AI Proposal Generator
- Server API (`/api/ai/generate-proposal`) writing tailored cover letter drafts based on project description and freelancer portfolio context, populated into an editable modal (`AIProposalModal.tsx`).

### G. Developer Community & ✨ AI Moderation Engine
- Community forum (`/community`) with post creation, likes, comments, and post types (`QUESTION`, `ADVICE`, `SHOWCASE`, `COLLABORATION`, `DISCUSSION`).
- Automated AI Moderation (`/api/ai/moderate-post`) classifying content into `SAFE` (auto-publish), `REVIEW` (pending admin queue), or `BLOCK` (auto-reject).

### H. ✨ AI Freelancing Assistant
- Interactive strategy chat assistant (`/assistant` and `/api/ai/assistant`) providing pricing, portfolio, and proposal negotiation advice.

### I. Role-Based Dashboards & Admin Control Panel
- Dedicated Freelancer (`/dashboard`), Client (`/dashboard`), and Admin (`/admin`) portals.
- Admin Panel for auditing flagged community posts and suspending/unsuspending abusive accounts.

---

## 2. Technology Stack & Database Schema

- **Frontend/Backend**: Next.js 14 App Router, TypeScript, React 19, Tailwind CSS, Lucide Icons.
- **Database**: Prisma ORM with PostgreSQL.
- **Prisma Schema (`prisma/schema.prisma`)**:
  - `User` (id, email, username, name, role, suspended, createdAt)
  - `Profile` (id, userId, headline, bio, avatarUrl, experienceLevel, hourlyRate, availability, links, portfolio)
  - `Skill`, `UserSkill`, `ProjectSkill`
  - `Project` (id, clientId, title, description, budgetMin, budgetMax, deadline, experienceLevel, status, createdAt)
  - `Application` (id, projectId, freelancerId, proposal, proposedPrice, expectedDays, status, createdAt)
  - `Post`, `Comment`, `Like`, `Notification`
  - `AiModerationResult`, `AiRecommendation`, `AiGeneratedProposal`
  - `PasswordResetToken` (id, tokenHash, userId, createdAt, expiresAt, used)

---

## 3. Design System & Aesthetics

- Modern, sleek dark mode theme (`slate-900`/`slate-950` backgrounds, `indigo-500`/`purple-600` primary gradients).
- Glassmorphism card containers (`bg-slate-900/80 border-slate-800 backdrop-blur-md`).
- Responsive layout across desktop, tablet, and mobile viewport sizes.

---

## 4. Environment Variables Setup (`.env.example`)

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:password@localhost:5432/skillbridge?schema=public"
OPENAI_API_KEY="your-openai-api-key"
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="smtp-username"
SMTP_PASSWORD="smtp-password"
SMTP_FROM="SkillBridge AI <noreply@skillbridge.ai>"
```

---

## 5. Verification & Acceptance Criteria

1. Type check: `npx tsc --noEmit` must pass with 0 errors.
2. Build verification: `npm run build` completes cleanly.
3. Password Reset Security: Tokens must be SHA-256 hashed, single-use, 15-minute expiring, and non-enumerating.
4. AI Fallback: All AI endpoints must handle timeouts gracefully without crashing API routes.
```
