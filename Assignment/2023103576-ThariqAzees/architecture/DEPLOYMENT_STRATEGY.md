# Deliverable 3: Deployment Strategy & Serverless Infrastructure

**Student Name:** Thariq Azees  
**Roll Number:** 2023103576  
**Course:** IoC — Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
**Project Name:** SkillBridge AI — Smart Freelance Marketplace & AI Agent Ecosystem  
**Repository URL:** [https://github.com/ThariqAzees/SkillBridgeAI](https://github.com/ThariqAzees/SkillBridgeAI)  
**Live Application URL:** [https://skill-bridge-ai-blush.vercel.app/it](https://skill-bridge-ai-blush.vercel.app/it)  

---

## 1. Executive Summary & Production Topology

SkillBridge AI is deployed on **Vercel Serverless Platform** (Hobby Plan) with backend database persistence provided by **Supabase Cloud PostgreSQL** and AI features powered by **OpenAI API**.

```mermaid
graph LR
    User([Browser Client]) --> DNS[Vercel Edge Network / CDN]
    DNS --> Serverless[Next.js Serverless Functions (Vercel Node.js Runtime)]
    
    subgraph Storage_Services [Database & Auth Services]
        Serverless -->|Prisma Client Pooling| Postgres[(Supabase Cloud PostgreSQL)]
        Serverless -->|Admin API / REST| SupabaseAuth[Supabase Auth Service]
    end

    subgraph External_APIs [Third-Party APIs]
        Serverless -->|HTTPS REST| OpenAI[OpenAI API (GPT-4o-mini)]
        Serverless -->|SMTP Port 465/587| Nodemailer[Nodemailer SMTP Gateway]
    end
```

---

## 2. CI/CD & Deployment Pipeline

### 2.1 Git Workflow & Deployment Triggers
- **Source Repository**: `https://github.com/ThariqAzees/SkillBridgeAI`
- **Production Branch**: `main`
- **Deployment Pipeline**: Connected via Vercel GitHub integration. Any push to `main` triggers automated build, type checking (`tsc --noEmit`), and production deployment to `https://skill-bridge-ai-blush.vercel.app/it`.

### 2.2 Build Execution Lifecycle
1. **Repository Fetch**: Pulls source code from `main` branch.
2. **Dependency Installation**: `npm install` installs required packages.
3. **Prisma Client Generation**: Runs `prisma generate --schema=prisma/schema.prisma` via `postinstall` hook to generate OS-compatible client binaries for Linux x64 serverless instances.
4. **Next.js Compilation**: Executes `next build` compiling App Router pages, server actions, and API routes.
5. **Static Site & Serverless Function Generation**: Prerenders static routes (`/`, `/login`, `/signup`, `/forgot-password`) and compiles dynamic API routes (`/api/*`).

---

## 3. Environment Variables Configuration Checklist

The production deployment requires the following environment variables configured in the Vercel Dashboard under **Project Settings -> Environment Variables**:

| Variable Name | Exposure Scope | Purpose | Verification Status |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Application base URL (`https://skill-bridge-ai-blush.vercel.app`) | Verified |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project URL | Verified |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Supabase publishable/anon key | Verified |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged Supabase key for server-side user password updates | Verified |
| `DATABASE_URL` | **Server-Only** | PostgreSQL connection string (Supabase Transaction Pooler port 6543) | Verified |
| `OPENAI_API_KEY` | **Server-Only** | OpenAI API key for proposal generation, matching & moderation | Verified |
| `SMTP_HOST` | **Server-Only** | Nodemailer SMTP server host | Verified (Configured in .env) |
| `SMTP_PORT` | **Server-Only** | SMTP port (`465` SSL or `587` TLS) | Verified |
| `SMTP_USER` | **Server-Only** | SMTP authentication username | Verified |
| `SMTP_PASSWORD` | **Server-Only** | SMTP authentication password | Verified |
| `SMTP_FROM` | **Server-Only** | Authorized sender email address (`SkillBridge AI <noreply@domain>`) | Verified |

---

## 4. Serverless Technical Considerations & Limitations

### 4.1 Database Connection Pool Management
- **Issue**: Serverless functions scale statelessly, which can quickly exhaust PostgreSQL default connection limits (e.g., 100 max connections).
- **Mitigation**:
  - Implemented singleton pattern in `src/lib/prisma.ts` to prevent multiple Prisma Client instantiations during cold starts.
  - Production `DATABASE_URL` uses Supabase Transaction Pooler (port 6543) with `?pgbouncer=true` parameters.

### 4.2 File Upload & Persistence Strategy
- **Issue**: Vercel serverless functions have a read-only filesystem (except `/tmp`), meaning local image uploads (`/public/uploads`) fail in production.
- **Implementation**: Profile avatar URLs and portfolio project image links store external HTTPS URLs or Base64 data strings rather than writing to local disk storage.

### 4.3 Execution Timeouts & Fallbacks
- **Issue**: Vercel Hobby plan enforces a 10-second maximum execution timeout for API routes.
- **Mitigation**: All OpenAI API calls in `src/lib/ai/index.ts` enforce an 8000ms timeout window. If OpenAI exceeds 8 seconds, the API safely aborts and invokes local fallback logic without causing Vercel 504 Gateway Timeouts.

---

## 5. Free-Tier Cost Management & Limits

| Infrastructure Component | Service Provider | Free-Tier Limits | SkillBridge AI Consumption Strategy |
| :--- | :--- | :--- | :--- |
| **App Hosting & CDN** | Vercel (Hobby Plan) | 100GB bandwidth, 100k edge requests/day | Optimized static prerendering; lightweight dynamic routes. |
| **Auth & PostgreSQL DB** | Supabase (Free Tier) | 500MB DB storage, 50k monthly active users | Schema index optimization; automatic cleanup of expired reset tokens. |
| **AI Processing** | OpenAI API | Pay-per-token (GPT-4o-mini) | Using `gpt-4o-mini` model (costing ~$0.15/1M input tokens); strict max token limits (`max_tokens: 300`). |
| **Email Delivery** | Nodemailer / SMTP | Varies by provider (e.g. Resend 3,000 emails/mo) | Password reset emails generated only on valid requests; 15-minute token expiry prevents email spam. |
