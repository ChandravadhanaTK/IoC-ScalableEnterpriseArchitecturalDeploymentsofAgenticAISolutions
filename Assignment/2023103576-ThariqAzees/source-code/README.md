# SkillBridge AI — Smart Freelance Ecosystem

SkillBridge AI is a realistic, production-ready full-stack AI freelance marketplace built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Supabase Auth**, **Prisma ORM**, and **OpenAI API**.

---

## Key Features

1. **Freelancer Profile System**:
   - Comprehensive profile page, creation, avatar, experience level, hourly rate, availability, social links, and portfolio projects.
   - Public freelancer discovery directory with skill & category search.

2. **✨ AI Profile Enhancer**:
   - Server-side AI optimization analyzing headline, bio, skills, experience, and portfolio work.
   - Interactive review modal requiring explicit user acceptance (never auto-overwriting).

3. **Project Marketplace**:
   - Client project creation, management, editing, and deletion.
   - Freelancer project browsing, skill search, experience level, and budget filtering.

4. **✨ AI Project Compatibility Matching**:
   - Real-time compatibility score (e.g. 94%) with transparent feature breakdown (*✓ Next.js matches skills*, *✓ Similar portfolio experience*).

5. **Application Workflow**:
   - Complete proposal application lifecycle (`SUBMITTED` → `VIEWED` → `SHORTLISTED` → `ACCEPTED` / `REJECTED`).
   - Authorization rules preventing unauthorized access.

6. **✨ AI Proposal Generator**:
   - Generates client-centric, editable cover letters based on project description and freelancer portfolio.

7. **Freelancer Community**:
   - Categorized developer forum with posts, likes, comments, and post types (`QUESTION`, `ADVICE`, `SHOWCASE`, `COLLABORATION`, `DISCUSSION`).

8. **✨ AI Content Moderation Engine**:
   - Multi-tier safety pipeline (`SAFE` → auto-publish, `REVIEW` → admin review queue, `BLOCK` → auto-reject).

9. **✨ AI Freelancing Assistant**:
   - Interactive chat assistant for pricing strategy, portfolio advice, and proposal optimization.

10. **Role-Based Dashboards & Admin Control Panel**:
    - Dedicated freelancer, client, and admin dashboards.
    - Admin panel for reviewing flagged posts and suspending abusive users.

---

## Tech Stack

- **Framework**: Next.js 14.2 (App Router, Server Actions, API Routes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database / ORM**: Prisma ORM, PostgreSQL (pgvector column included)
- **Authentication**: Supabase Auth & Role-Based Auth Context
- **AI Integrations**: OpenAI GPT-4o-mini with timeout/fallback heuristics

---

## Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables (`.env`)**:
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/skillbridge"
   OPENAI_API_KEY="your-openai-api-key"
   NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

3. **Database Migration**:
   ```bash
   npx prisma migrate dev
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Vercel Deployment & Password Reset Architecture

1. **Vercel Hobby Deployment**:
   - Configured for seamless deployment on Vercel Serverless.
   - Automatic Prisma Client generation on build/install.

2. **Nodemailer SMTP Password Reset**:
   - Cryptographic 64-character SHA-256 hashed single-use tokens stored in `PasswordResetToken` database table.
   - 15-minute token expiration and atomic consumption.
   - Server-side synchronization with Supabase Auth (`supabaseAdmin.auth.admin.updateUserById`).
   - Non-enumerating password recovery API responses.

