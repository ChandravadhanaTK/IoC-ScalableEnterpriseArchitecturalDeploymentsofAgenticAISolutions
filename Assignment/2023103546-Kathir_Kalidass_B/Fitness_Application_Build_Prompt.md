Here is a complete, ready-to-use enhanced prompt for building a premium AI-powered fitness application on Lovable.dev — "HFC — Holistic Fitness Club 2.0" with advanced features:

---

# Build HFC 2.0 — Holistic Fitness Club App

## 0. Platform Context & Hosting
- Build the entire application using **Lovable.dev** — an AI-powered full-stack development platform that scaffolds, generates, and iterates on web applications through natural-language prompts.
- Use **Lovable Cloud** (managed Supabase backend) for all data, auth, storage, edge functions, and realtime features — Lovable configures this natively when you enable "Backend" in the project settings.
- Every database migration must include RLS policies, GRANT statements, and index definitions in the same migration file.
- Use **Lovable's built-in GitHub integration** for version control — push code, open PRs, and review diffs directly from the Lovable interface.
- Deploy production via **Lovable's one-click publish** with a custom domain configured in the Lovable dashboard.
- **AI features** (AI Coach, meal planning, form-check) run through **Lovable Cloud Edge Functions** (Deno runtime) that call Anthropic Claude API or OpenAI API using server-side environment variables — never expose API keys in client-side code.
- All images stored in **Supabase Storage** with signed URLs; use Unsplash source URLs as placeholders for seeded content.

---

## 1. Technology Stack (Strict Requirements)
- **App Platform:** Lovable.dev — scaffold a new project in Lovable, select "React + Vite + TypeScript" template, enable Lovable Cloud backend.
- **Framework:** React 18 with Vite 5 and TypeScript (Lovable default stack).
- **Styling:** Tailwind CSS v3 — configure design tokens in `tailwind.config.js` and define CSS custom properties in `src/index.css` for the dark neon theme.
- **UI Library:** shadcn/ui (Lovable's preferred component library) — install and customize all components for the dark theme with green accent colors.
- **Backend / Database / Auth / Storage / Realtime:** Lovable Cloud (Supabase) — Postgres 15, Row Level Security (RLS), Supabase Auth (email + Google OAuth), Supabase Storage with RLS, Supabase Realtime for chat.
- **Routing:** React Router v6 with lazy-loaded route components for code splitting.
- **Charts:** Recharts with `#8BC000` (neon green) data lines and bars, animation enabled.
- **Icons:** Lucide React (bundled with shadcn/ui).
- **Fonts:** Montserrat (weights 400, 500, 700, 900) from Google Fonts for the main app; Nunito (weights 400, 700) for the Kids section.
- **AI Integration:** Anthropic Claude API (via Lovable Cloud Edge Function for server-side proxy). Use the `claude-3-5-sonnet-20241022` model for text, `claude-3-5-haiku-20241022` for fast queries.
- **State Management:** TanStack Query (React Query) v5 for server-side cache; Zustand for local UI state.
- **Forms:** react-hook-form with Zod validation schemas.
- **Date & Time:** date-fns for formatting and date arithmetic.
- **Notifications:** Sonner (toast library, bundled with shadcn/ui).
- **PWA:** @vite-pwa/vite-plugin — generate manifest.json and service worker for installable mobile experience.
- **Animations:** Framer Motion for page transitions, scroll animations, and complex spring-based animations. CSS @keyframes for lightweight effects.
- **Image Handling:** Direct upload to Supabase Storage using `supabase.storage.from().upload()` with path-based user folders. Generate thumbnails via Supabase Image Transformations.
- **Validation:** Zod for all form validations and Edge Function input/output schemas.

---

## 2. Global Design System (Must Be Applied Everywhere)

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#000000` | All page backgrounds |
| Card Surface | `#111111` | Cards, panels, modals |
| Card Surface Alt | `#0D0D0D` | Alternating cards |
| Card Border | `1px solid rgba(139, 192, 0, 0.15)` | All card borders |
| Primary | `#8BC000` | Buttons, accents, glows, active states |
| Primary Hover | `#A4D900` | Hover states on primary elements |
| AI Accent | `#00E0FF` | Cyan for AI/Coaching features (use sparingly) |
| Warning | `#FFB020` | Warnings, streak at risk |
| Danger | `#FF4D4D` | Destructive actions, errors |
| Success | `#8BC000` | Same as primary |
| Text Primary | `#FFFFFF` | Headings, body text |
| Text Secondary | `#888888` | Subtitles, placeholder labels |
| Input BG | `#1A1A1A` | Input fields, textareas |
| Input Border | `#2A2A2A` | Input borders |
| Input Focus Ring | `3px solid #8BC000` | Focus state |
| Overlay | `rgba(0,0,0,0.85)` | Modals, drawers, backdrops |

### Typography
- **Headings:** Montserrat Black (900) — Hero titles, page titles.
- **Subheadings:** Montserrat Bold (700) — Section headers, card titles.
- **Body:** Montserrat Medium (500) — Paragraphs, labels, button text.
- **Kids Section:** Nunito 700/400 for a friendly, rounded feel.
- **Scale:** text-xs (0.75rem), text-sm (0.875rem), text-base (1rem), text-lg (1.125rem), text-xl (1.25rem), text-2xl (1.5rem), text-3xl (1.875rem), text-4xl (2.25rem), text-5xl (3rem), text-6xl (3.75rem).

### Components
- **Buttons:** Primary: `bg-[#8BC000] text-black font-bold px-6 py-3 rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(139,192,0,0.3)] transition-all duration-200`. Ghost: transparent bg, green border, green text on hover. AI: cyan border, cyan glow, ✨ sparkle icon.
- **Cards:** `bg-[#111111] border border-[rgba(139,192,0,0.15)] rounded-3xl p-6 hover:shadow-[0_0_30px_rgba(139,192,0,0.08)] transition-all duration-300`.
- **Inputs:** `bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder:text-[#555] focus:outline-none focus:ring-3 focus:ring-[#8BC000]`.
- **Badges:** Rounded-full, px-3 py-1, text-sm, semi-transparent backgrounds.
- **Scrollbars:** Track `#000`, thumb `#8BC000`, width `5px`, rounded-full.
- **Shadows:** Use colored shadows — green for primary, cyan for AI, red for danger.

### Animations (Global @keyframes)
Define all of these in `src/index.css`:
```
@keyframes fadeIn          — 0% opacity 0 → 100% opacity 1, 300ms ease-out
@keyframes slideUp         — 0% translateY(30px) opacity 0 → 100% translateY(0) opacity 1, 400ms ease-out
@keyframes scaleIn         — 0% scale(0.8) opacity 0 → 100% scale(1) opacity 1, 300ms ease-out
@keyframes glowPulse       — 0%/100% opacity 1 → 50% opacity 0.5, 2000ms infinite
@keyframes streakGlow      — 0%/100% text-shadow green 0 0 10px → 50% text-shadow green 0 0 30px, 1500ms infinite
@keyframes confettiFall    — 0% translateY(-100%) rotate(0deg) → 100% translateY(100vh) rotate(720deg), 3000ms ease-in
@keyframes checkBounce     — 0% scale(0) → 60% scale(1.2) → 100% scale(1), 400ms ease-out
@keyframes countUp         — 0% opacity 0 translateY(10px) → 100% opacity 1 translateY(0), 500ms ease-out
@keyframes badgeGlow       — 0%/100% box-shadow green glow → 50% box-shadow none, 2000ms infinite
@keyframes celebrationBounce — 0% translateY(0) → 25% translateY(-20px) → 50% translateY(0) → 75% translateY(-10px) → 100% translateY(0), 600ms ease-out
@keyframes shimmer         — 0% background-position -200% 0 → 100% background-position 200% 0, 2000ms linear infinite
@keyframes floatBounce     — 0%, 100% translateY(0) → 50% translateY(-15px), 2000ms ease-in-out infinite
@keyframes ripple          — 0% scale(0) opacity 0.5 → 100% scale(4) opacity 0, 600ms ease-out
@keyframes spinSlow        — 0% rotate(0deg) → 100% rotate(360deg), 8000ms linear infinite
@keyframes typewriter      — from width 0 → to width 100%, 2s steps(40) 1
@keyframes particleDrift   — 0% translate(0,0) opacity 1 → 100% translate(var(--dx), var(--dy)) opacity 0, 3000ms ease-out infinite
```

### Design Principles
- **Dark mode is the only mode** — no light theme toggle.
- **Generous spacing:** p-6, gap-6 for cards; p-4, gap-4 for compact layouts.
- **Border radius:** rounded-xl for inputs/buttons, rounded-2xl for cards, rounded-3xl for hero cards.
- **Transitions:** 200ms–300ms ease-out for hover states, 400ms–600ms for page transitions.
- **Hover lift:** `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,192,0,0.1)]` on all interactive cards.
- **Loading skeletons:** shimmer animation on dark gray (`#1A1A1A`) background while data loads.

---

## 3. Authentication, Roles, Authorization & Onboarding

### Authentication Methods
- **Email/Password** — Standard signup with email verification (Supabase Auth).
- **Google OAuth** — One-click "Sign in with Google" (configure Supabase Auth provider).
- **Apple OAuth** — One-click "Sign in with Apple" for iOS users (configure Supabase Auth provider).
- **Phone OTP** — SMS-based one-time password login (Supabase Auth phone provider).
- **Magic Link** — Email-based passwordless login (Supabase Auth magic link).
- No anonymous/signup-without-email allowed. All users must confirm their email before accessing the app.

### User Roles (Exactly 5 Roles)
| Role | Description | Access Level |
|------|-------------|-------------|
| `super_admin` | Platform owner | Full access to everything including admin panel, impersonation, AI config |
| `admin` | Club administrator | Admin panel, user management, content moderation, broadcast |
| `mentor` | Trainer / Coach | Member management in groups, create events, challenges, programs |
| `user` | Member / Athlete | Standard member features (codex, workouts, progress, chat, etc.) |
| `parent` | Parent of junior warrior | View child's progress, approve milestones, manage screen time |

### Profiles Table
Create `public.profiles` table linked to `auth.users(id)` with ON DELETE CASCADE. Auto-create profile on signup using a `BEFORE INSERT` database trigger on `auth.users`.

**Profile columns:**
```
id              uuid PK (FK to auth.users)
username        text UNIQUE NOT NULL  — title-case display name
full_name       text                  — legal full name
nickname        text                  — casual name used in greetings
phone           text                  — E.164 format
email           text                  — cached from auth.users
role            text                  — cached role (denormalized for performance)
avatar_url      text                  — Supabase Storage path
birthday        date                  — for age calculation
gender          text                  — male/female/other/prefer_not_to_say
height_cm       numeric(5,2)          — height in centimeters
weight_kg       numeric(5,2)          — weight in kilograms
bmi             numeric(4,2)          — computed: weight_kg / (height_m)^2
body_fat_pct    numeric(4,1)          — manual entry (%)
muscle_mass_kg  numeric(5,2)          — manual entry (kg)
diet_preference text                  — veg / non-veg / vegan / pescatarian / others
custom_diet     text                  — free text if diet_preference = 'others'
activity_level  text                  — sedentary / light / moderate / active / athlete
fitness_goals   text[]                — weight_loss, muscle_gain, endurance, flexibility, strength, mental_health, rehab, general_fitness
medical_conditions text[]             — e.g. ["diabetes", "hypertension"]
allergies       text[]                — e.g. ["peanuts", "dairy"]
past_injuries   text                  — free text description
medications     text                  — free text description
sleep_hours_avg numeric(3,1)          — average nightly sleep
hydration_liters_avg numeric(3,1)     — average daily water intake
credits         integer DEFAULT 0     — in-app currency
xp              integer DEFAULT 0      — experience points
level           integer DEFAULT 1      — computed from XP thresholds
streak_current  integer DEFAULT 0      — current consecutive-day streak
streak_best     integer DEFAULT 0      — personal best streak
streak_freeze_tokens integer DEFAULT 3 — monthly refill
referral_code   text UNIQUE            — generated on signup (random 8-char alphanumeric)
referred_by     uuid                   — FK to profiles.id
social_handle   text                  — Instagram ID
joining_date    date                   — first login date
last_active_at  timestamptz            — last app open
timezone        text                   — IANA timezone (e.g. "Asia/Kolkata")
locale          text DEFAULT 'en'      — language preference
privacy_level   text DEFAULT 'group'   — public / group / private
messaging_scope text DEFAULT 'everyone' — everyone / group / mentors_only / none
two_factor_enabled boolean DEFAULT false
two_factor_secret text                 — TOTP secret (encrypted at rest)
is_verified     boolean DEFAULT false   — email verified
is_banned       boolean DEFAULT false   — soft ban
banned_reason   text                   — ban explanation
ban_expires_at  timestamptz            — null = permanent
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
deleted_at      timestamptz             — soft delete (null = active)
```

### User Roles Table
Create `public.user_roles` — never store roles directly on `profiles`:
```
user_id    uuid FK to auth.users ON DELETE CASCADE
role       text CHECK (role IN ('super_admin','admin','mentor','user','parent'))
created_at timestamptz DEFAULT now()
PRIMARY KEY (user_id, role)
```

Create a `has_role(user_id uuid, role text)` security-definer function for safe role checks. Use this function in all RLS policies.

### Authorization Rules (RLS Policies)
- **super_admin:** Full access to all tables, bypass all RLS.
- **admin:** CRUD on profiles, groups, events, challenges, gallery, posts, notifications. Read audit log. Broadcast messages.
- **mentor:** Read/write own group's members. Create events/challenges. Moderate own group's content.
- **user:** CRUD on own data only. Read group-level public data. Post/comment in community. Chat in group channels.
- **parent:** Read child's codex, workouts, progress. No write access.

### Onboarding Wizard (First Login Only)
Show a 4-step wizard after first successful login (stored in `profiles.onboarding_completed` boolean):
1. **Welcome** — "Welcome to HFC, {nickname}! Let's set you up in 60 seconds." with animated branding.
2. **Body Metrics** — Height, weight, gender, birthday (with age auto-calculated), timezone dropdown (IANA).
3. **Goals** — Multi-select chip grid: Weight Loss, Muscle Gain, Endurance, Flexibility, Strength, Mental Health, Rehab, General Fitness. Pick at least 1.
4. **Activity & Diet** — Activity level slider (Sedentary → Athlete). Diet preference select (Veg/Non-veg/Vegan/Pescatarian/Others + free-text).
- Progress dots at top, Skip button, animated transitions between steps.
- Completion awards +50 XP bonus.

### Protected Routes
- All app routes under `/app/` — redirect unauthenticated users to `/login` using a `ProtectedRoute` wrapper component.
- Admin panel at `/app/admin` — additionally checks for `super_admin` or `admin` role, redirects with "Access Denied" toast if unauthorized.
- Audit all authorization failures into `public.audit_log`.

### Audit Log
```
id              uuid PK
actor_id        uuid FK to auth.users    — who performed the action
actor_role      text                     — role at time of action
target_id       uuid FK to auth.users    — who/what was affected
target_type     text                     — user / role / post / setting
action          text                     — role_change / permission_change / ban / impersonate / access_denied
path            text                     — route path where action occurred
details         jsonb                    — full context (old_role, new_role, ip, user_agent)
created_at      timestamptz DEFAULT now()
```
- Populate via database trigger + RPC function for server-side logging.
- Admin can view/search/export. Never allow user deletion of audit entries.

### Security Measures
- All `public` schema tables must have `GRANT SELECT, INSERT, UPDATE, DELETE` with role-specific rules in the same migration that creates the table.
- Views exposing profile data use `SECURITY INVOKER`.
- Security-definer functions only for: `has_role()`, role checks, mentor assignment scope checks.
- Email confirmation required before first login (Supabase Auth setting).
- `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;` — grant per-function.
- Server Functions (Edge Functions) validate Zod schemas, check auth, log errors. Never trust client input.
- Admin Supabase client (`SUPABASE_SERVICE_ROLE_KEY`) loaded only inside Edge Functions and server-side code — never imported into React components or route loaders.
- Rate limiting on auth routes (10 attempts/minute per IP) via Edge Function middleware.
- CSRF protection on all mutation endpoints.

---

## 4. Landing Page (`/`)
- Full `#000000` background, no exceptions.
- **Hero Section:** Animated SVG fitness logo with morph animation. Headline: "Train Hard. Heal Holistically." in Montserrat Black (text-6xl). Sub-headline: "HFC combines strength, nutrition, recovery, and mindset into one gamified journey." in Montserrat Medium (text-xl). Neon green "Get Started" CTA button (scrolls to `/login`). Particle animation background (canvas-based, green dots floating upward).
- **Stats Bar:** 4 animated counters (Members Active, Workouts Logged, Streaks Achieved, kg Lifted) with `countUp` animation on scroll (Intersection Observer). Green numbers, gray labels.
- **How It Works:** 3-step visual — "Join HFC" → "Track Daily" → "Level Up" — with Lucide icons and connecting lines.
- **Featured Programs Carousel:** Auto-scrolling cards for Strength Training, HIIT, Yoga Flow, Martial Arts, Junior Warriors, Recovery & Mobility. Each card has image, title, brief description, "Explore" link.
- **Testimonials Slider:** Auto-rotating with 4 testimonials (member photos via Unsplash, name, nickname, quote, streak count). Manual dot navigation + swipe support.
- **CTA Banner:** "Ready to Transform?" with gradient green background, CTA button, PWA download link.
- **Footer:** Logo, About, Programs links, Contact email, Instagram link, Privacy Policy, Terms of Service. Dark subtle separator.
- **SEO:** Unique `<title>`, `<meta description>`, Open Graph tags, Twitter Card tags on every page.

---

## 5. Login & Signup (`/login`, `/signup`)
### Split-Screen Cinematic Design
- **Left Panel (60% on desktop):**
  - Animated particle background using HTML5 Canvas — green dots that react to mouse movement.
  - Large glowing HFC logo centered with `glowPulse` animation.
  - Daily motivational quote (seeded array of 365 quotes, one per day) with typewriter `typewriter` animation.
  - 3 stat badges at bottom (Members online, Streaks today, Workouts this week) with `fadeIn` staggered.
  - Mobile: left panel becomes a slim top bar with logo + quote.
- **Right Panel (40%):**
  - Dark warrior-themed form card centered with `slideUp` animation.
  - Tab switcher: "Sign In" / "Sign Up" with animated underline.
- **Login Form:** Email input, Password input, "Forgot Password?" link (opens reset modal), Google OAuth button (with Google icon), Apple OAuth button (with Apple icon), Phone OTP button, "Sign in with Magic Link" toggle. Submit button: green full-width.
- **Signup Form:** Email, Password (with strength meter: red → yellow → green), Username (live title-case preview), Full Name, Phone (with country code dropdown + validation), Nickname, Group (dropdown, empty = "No group yet"), Trainer (dropdown, empty = "None"). Submit button triggers email verification flow.
- **First Login Welcome:** After email verification and first login, show a full-screen celebration: "Welcome to HFC, {nickname}!" with confetti animation, avatar upload prompt, and redirect to onboarding wizard.
- **Password Reset (`/reset-password`):** Check for `type=recovery` in Supabase Auth hash, show "New Password" + "Confirm Password" form, call `supabase.auth.updateUser({ password })`. Success → auto-login + redirect to onboarding.
- **Magic Link Flow:** User enters email → Edge Function sends magic link via Supabase Auth → user clicks link in email → auto-login → redirect.

---

## 6. Navigation System

### Desktop Sidebar (Left)
```
┌──────────────────────┐
│  🟢 HFC Logo         │  ← Fixed, collapsible
│  ─────────────────── │
│  🏠 Dashboard        │  ← Active: green underline + scale(1.2)
│  📋 Codex            │
│  💪 Workouts         │
│  📈 Progress         │
│  🏆 Achievements     │
│  🏅 Leaderboard      │
│  🤖 AI Coach         │  ← Cyan icon (special)
│  🥗 Nutrition        │
│  👥 Community        │
│  💬 Chat             │
│  📅 Events           │
│  🎯 Challenges       │
│  🖼️  Gallery         │
│  🩺 Health           │
│  📚 Library          │
│  🎮 Junior Warriors  │
│  ⭐ Store            │
│  ─────────────────── │
│  ⚙️  Settings        │
│  👤 Profile          │
│  🔴 Sign Out         │
└──────────────────────┘
```
- Background: `rgba(0,0,0,0.95)`, bottom border `rgba(139,192,0,0.15)`.
- Width: 260px expanded, 72px collapsed (icons only).
- Active item: green left border (3px) + green text + `scale(1.2)` icon animation.
- Hover: `bg-[rgba(139,192,0,0.05)]` background.
- Collapse toggle button at bottom (hamburger → arrows).

### Mobile Bottom Tab Bar
- Fixed bottom, 5 tabs: Home, Codex, Workouts, AI Coach, Profile.
- Dark translucent background: `rgba(0,0,0,0.9)` with `backdrop-blur(12px)`.
- Active tab: green dot below icon + green icon color.
- Icons: 24px, labels: text-xs below.

### Top Header (both views)
- Right side: Notification bell (red dot + count), Credits pill (`⭐ 1,250`), XP/Level badge (`Lvl 12 ⬆`), Avatar dropdown (Profile, Settings, Sign Out).
- Breadcrumb on sub-pages.
- Hamburger menu on mobile (opens drawer from left).

### Command Palette (Cmd/Ctrl+K)
- Fuzzy-search modal overlay.
- Search across: all routes, member names, exercise names, food items, event names, badge names, posts.
- Recent searches saved in localStorage.
- Keyboard navigable (↑↓ arrows, Enter to select, Esc to close).

### All Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/app` | Dashboard | Personal overview + admin stats |
| `/app/codex` | DailyCodex | 9-habit tracker with streaks |
| `/app/workouts` | Workouts | Library + logger + history |
| `/app/progress` | Progress | Charts, PRs, body metrics |
| `/app/achievements` | Achievements | Badge gallery |
| `/app/leaderboard` | Leaderboard | Rankings with podium |
| `/app/ai-coach` | AICoach | AI fitness chat |
| `/app/nutrition` | Nutrition | Meal planner + tracker |
| `/app/community` | Community | Social feed |
| `/app/chat-panel` | ChatPanel | Group + DM chat |
| `/app/mentors` | MentorsDirectory | Trainer profiles |
| `/app/events` | Events | Calendar + RSVP |
| `/app/challenges` | Challenges | Group challenges |
| `/app/gallery` | Gallery | Photo albums |
| `/app/health-logs` | HealthLogs | Vitals, mood, meds |
| `/app/inventory` | Inventory | Equipment management |
| `/app/library` | Library | Books, articles, videos |
| `/app/store` | Store | Credits redemption |
| `/app/kids` | JuniorWarriors | Kids gamified fitness |
| `/app/about` | AboutPage | About, Groups, Trainers, Members |
| `/app/profile` | Profile | User profile |
| `/app/settings` | Settings | Account, privacy, billing |
| `/app/admin` | AdminPanel | Full admin dashboard |

---

## 7. Dashboard (`/app`)

### Member View
- **Greeting Card:** "Good {morning/afternoon/evening}, {nickname}! 👋" with current date, weather widget (placeholder).
- **Today's Summary Row:** Codex progress (X/9 ✅), Workout due (None / "Full Body — 45 min"), Calories consumed (X/2000 kcal), Water (X/8 glasses).
- **AI Suggestion Card (Cyan):** "✨ Today's Focus: Based on your rest day yesterday, try a light mobility flow. Ask Coach for details?" with sparkle icon.
- **Weekly Activity Heatmap:** 7×7 grid (last 7 weeks × 7 days), GitHub-contribution-style. Green intensity by activity count. Tooltip on hover showing date + activity type.
- **Mood Slider:** 1–10 horizontal slider with emoji faces (😢→😊→🤩), labeled "How are you feeling today?" Logs to `health_logs`.
- **Quick Actions:** 4 big icon buttons — Log Workout, Log Meal, Check Codex, Ask AI Coach.
- **Recent PRs Row:** Horizontal scroll of last 3 PRs with gold badge.
- **Upcoming Events:** Next event card with countdown timer.
- **Mentor Card:** "Your Mentor: {name}" with "Book Session" button, average rating.

### Admin View (role === 'admin' or 'super_admin')
- **Stats Grid:** 4 cards — Total Members (N), Admins (N), Mentors (N), Users (N). Hover each to see name list in tooltip.
- **New This Month:** List of profiles where `joining_date >= date_trunc('month', now())`.
- **No-Show Rate:** `(total_scheduled - total_attended) / total_scheduled * 100` for non-admin/member roles. Show as percentage with trend arrow.
- **Absent Users List:** Users who haven't logged in for 14+ days (excluding admins/mentors).
- **Engagement Metrics:** DAU/WAU/MAU cards. Codex completion rate (X% completed today).
- **Revenue Card:** (placeholder) Monthly revenue from store credits.
- **System Health Card:** DB size, active connections, Edge Function error rate, P95 latency.

### Super Admin Extra Cards
- All admin stats above plus: Total DB size, total storage used, Edge Function invocation counts, error rate, active Supabase project status.

---

## 8. Daily Codex (`/app/codex`) — 9-Habit Tracker

### Header
- Flame emoji 🔥 with size scaled by streak tier:
  - Tier 0 (streak 0): no flame, grayed out text "Start your streak today!"
  - Tier 1 (1–6 days): text-2xl flame, green
  - Tier 2 (7–14 days): text-4xl flame, orange with `glowPulse`
  - Tier 3 (15–29 days): text-5xl flame, orange-red with `streakGlow`
  - Tier 4 (30+ days): text-7xl flame, red-orange with intense `streakGlow` + `floatBounce`
- Streak number below flame: text-5xl Montserrat Black `#8BC000` with `streakGlow` animation.
- Motivational message by tier: "Great start!" / "Building momentum!" / "On fire! 🔥" / "Unstoppable! 🏆" / "LEGENDARY! 👑".
- "Best streak: N days" in gray text.

### Habit List
- **9 habits:** Movement, Nutrition, Sleep, Hydration, Mindfulness, Learning, Connection, Gratitude, Recovery.
- Each row: icon (Lucide), habit name, description, toggle checkbox (custom green animated), optional note field (expandable).
- Checked rows: green left border, green checkmark with `checkBounce` animation, `bg-[rgba(139,192,0,0.05)]`.
- Unchecked: gray icon, gray text.
- Haptic-like visual feedback on toggle (small scale pulse).

### Progress Ring
- SVG circular progress ring (radius 60, stroke 8). Green fill proportional to X/9.
- Center text: "{X}/9" in large green, "Complete!" when all 9 checked.
- 90° gap at top (like Apple Watch activity rings).

### Perfect Day
- When all 9 checked: Full-width "🎉 PERFECT DAY!" banner with `confettiFall` animation from top.
- Award: +50 XP, +20 credits, "Perfect Day" badge check.
- Save to `public.codex_entries` with `perfect_day: true`.

### Streak Management
- Streak freeze card: shows "Streak Freezes: 3/3" (auto-refills monthly). "Use Freeze" button to save a streak if user forgot to check in. Consumes 1 token.
- Freeze logic: if user hasn't checked in by midnight + 2-hour grace period → prompt to use freeze or streak resets to 0.

### Journal
- Optional textarea: "How was your day?" (free text, stored encrypted in `codex_entries.notes_encrypted`).
- Character limit: 500.
- Expandable/collapsible.

### Streak History
- Below the habit list: mini bar chart showing last 30 days (green bars for complete days, gray for incomplete).
- Click a bar to see details for that day.

### Persistence
- Table `public.codex_entries`:
  ```
  id uuid PK, user_id uuid FK, entry_date date, habits_completed integer (0-9),
  perfect_day boolean, xp_earned integer, credits_earned integer,
  notes_encrypted text, freeze_used boolean, created_at timestamptz
  UNIQUE(user_id, entry_date)
  ```

---

## 9. Workout Logger & Library (`/app/workouts`)

### Library Tab
- Browse 100+ pre-seeded exercises in `public.exercises` table.
- Exercise card: name, muscle group icon (Lucide: Dumbbell, Arm, Leg, etc.), equipment tags, difficulty badge (Beginner/Intermediate/Advanced), video demo URL (YouTube embed placeholder).
- **Filters:** Muscle group dropdown (Chest, Back, Legs, Shoulders, Arms, Core, Full Body, Cardio), Equipment (Bodyweight, Dumbbell, Barbell, Kettlebell, Machine, Band, Cable), Difficulty.
- **Search:** Real-time autocomplete as user types (debounced 200ms via TanStack Query).
- Grid layout (3 columns desktop, 2 tablet, 1 mobile).

### Today's Workout Tab
- Shows AI Coach recommended workout or manual plan from `public.workouts` where `scheduled_date = today()`.
- "Start Workout" button → enters live logger mode (full-screen overlay).
- "Swap Exercise" button → opens exercise picker filtered by muscle group.
- Estimated duration, estimated calories, difficulty displayed.

### Live Workout Logger (Full-Screen Overlay)
- **Top bar:** Workout name, elapsed timer (mm:ss, large, monospace font green), pause/resume toggle, finish button.
- **Exercise list:** Scrollable list with:
  - Exercise name + thumbnail icon.
  - For each exercise: Set 1, Set 2, Set 3... — columns: Weight (kg input), Reps (number input), RPE slider (1–10), Checkmark (complete set).
  - Rest timer: auto-starts between sets (configurable: 60s/90s/120s/180s), shows circular countdown, "Skip Rest" button.
- **Bottom bar:** "Finish Workout" button (green), "Save Draft" button, exercise counter (X/Y completed).
- On finish: Summary screen with total volume, total sets, estimated calories, XP earned, "Log Another" or "Done" buttons. Auto-saves to `public.workouts` + `public.workout_sets`.

### History Tab
- List of past workouts, reverse chronological.
- Each entry: date, workout name, duration, total volume, exercises count, PRs achieved.
- Expandable to see per-set details.
- Filter by date range, muscle group, workout type.
- Export workout history as CSV.

### Templates Tab
- Save current workout as template (name, exercises, sets/reps scheme).
- Browse saved templates, "Use Template" to start a workout from it.
- Pre-seeded templates: "Push Day A", "Pull Day A", "Leg Day A", "Full Body Beginner", "HIIT 20min", "Upper Body Power".

### Programs Tab
- Multi-week structured programs:
  - "Push/Pull/Legs Split" (6 weeks)
  - "Full Body 3×/Week" (8 weeks)
  - "5K Running Plan" (4 weeks)
  - "30-Day HIIT Challenge"
- Each program shows: overview card, weeks breakdown, exercises per session, progression scheme (weights auto-increase each week).
- "Start Program" → creates first workout session.
- Progress tracking: completed workouts / total workouts, current week indicator.
- Award XP + badge on program completion.

### Voice Quick-Add
- Microphone button on exercise search → uses Web Speech API (`SpeechRecognition`).
- Transcribes "Add 60kg bench 8 reps" → auto-fills weight (60) and reps (8) in the last bench press set.
- Fallback: if Speech API unavailable, show manual input.

### Persistence
```
public.workouts:        id, user_id, name, type, scheduled_date, started_at, completed_at, duration_seconds, total_volume_kg, notes, created_at
public.workout_sets:    id, workout_id, exercise_id, set_number, weight_kg, reps, rpe, completed, rest_seconds, created_at
public.exercises:       id, name, muscle_group, equipment, difficulty, video_url, description, instructions, tips, created_at
```

---

## 10. Progress Page (`/app/progress`)

### Header
- Rotating motivational quote (from same seeded array as login page) with fade transition every 10 seconds.
- Date range selector: 1W / 1M / 3M / 6M / 1Y / All Time.

### Body Metrics Section
- **Weight Chart:** Recharts line chart — weight over time (data from `public.body_metrics`). Green line, green area fill below. Goal weight line (dashed red). Interactive tooltip on hover.
- **BMI Gauge:** Semi-circular gauge (custom SVG) showing current BMI with color zones (underweight blue, normal green, overweight yellow, obese red).
- **Body Composition:** Small stat cards — Body Fat %, Muscle Mass, Waist Circumference, Hip Circumference.

### Strength PRs Section
- **Per-exercise chart:** Select exercise from dropdown → Recharts line chart of 1RM estimated over time.
- **Volume chart:** Bar chart of total volume per workout session.
- **PR Detection:** Compare current set against previous best. On new PR → flash gold "🏆 New PR!" badge with `countUp` animation + toast notification + auto-post to community feed.
- **Progress Tests:** Track standard tests — Pushups (max), Pullups (max), Run 100m (time), Run 5K (time), Plank (duration), Squats (max), Deadlift 1RM, Bench 1RM.
- Data table with trend indicators (↑ improving, → stable, ↓ declining).

### Photo Progress
- Before/after photo comparison: drag slider across two images.
- Upload front/side/back photos (Supabase Storage, organized by user + date).
- Photos displayed in a timeline grid.
- Privacy: user-controlled visibility.

### Predictions
- Simple linear regression in TypeScript: "Based on your 6-month trend, you'll reach {goal} by {estimated_date}."
- Show confidence interval (68% / 95%) as shaded area on chart.
- Disclaimers: "This is an estimate — consistency is key!"

### Export
- "Export CSV" button downloads all progress data as CSV file.
- "Export PDF" via jsPDF with charts rendered as images.

### Persistence
```
public.body_metrics:    id, user_id, weight_kg, body_fat_pct, muscle_mass_kg, waist_cm, hip_cm, chest_cm, thigh_cm, arm_cm, photo_front_url, photo_side_url, photo_back_url, recorded_at, created_at
public.personal_records: id, user_id, exercise_id, exercise_name, value, unit (kg/time/reps), achieved_at, created_at
```

---

## 11. Nutrition Page (`/app/nutrition`)

### Meal Log Tab
- Day selector (date picker, defaults to today).
- 4 meal slots: Breakfast 🌅, Lunch ☀️, Dinner 🌙, Snack 🍎.
- Per meal: "Add Food" button → opens search modal.
- **Food Search:** 1000+ pre-seeded foods in `public.foods` table (name, brand, serving_size, calories, protein_g, carbs_g, fat_g, fiber_g). Search with autocomplete (debounced).
- Custom food entry: "Add Custom Item" form with all macro fields.
- Photo upload: attach meal photo (Supabase Storage).
- Daily totals card: Calories (X/2000), Protein (X/150g), Carbs (X/200g), Fat (X/65g). Circular progress rings per macro. Targets auto-calculated via Mifflin-St Jeor equation (BMR × activity multiplier).
- AI-generated feedback: "You're 30g short on protein today — try adding chicken or Greek yogurt!"

### AI Meal Plan Tab
- "Generate Meal Plan" button → opens configuration panel:
  - Duration: 3 days / 7 days / 14 days.
  - Calorie target (auto-calculated, editable).
  - Diet preference filter.
  - Exclude foods (allergies, dislikes).
  - Cuisine preference (Indian / Mediterranean / Keto / Vegan / Custom).
- Calls Edge Function `meal-plan-generator` which calls Claude API with the configuration + user profile.
- Displays generated plan as cards per day with meal slots, macros per meal, total per day.
- **Grocery List:** Auto-generated from meal plan. Checkable items organized by category (Proteins, Carbs, Vegetables, etc.). "Mark as Purchased" to strikethrough.

### Water Tracker
- 8 glasses visualization (water drop icons, fill on click).
- Each click: +1 glass, `ripple` animation on the clicked glass.
- Daily target: 8 glasses (configurable in profile).
- Visual progress: filled glasses turn blue, remaining are outlined.

### Weekly Overview
- Pie chart: macro distribution (protein/carbs/fat %).
- Bar chart: daily calories over the week.
- Average vs target comparison.

### Barcode Scan
- "Scan Barcode" button → opens camera (or file input fallback).
- Calls Edge Function `open-food-facts` proxy → Open Food Facts API.
- Returns product name, brand, nutrition facts → auto-populates food entry form.
- Fallback: manual barcode number input.

### Persistence
```
public.meals:         id, user_id, meal_type, food_id (FK), custom_name, calories, protein_g, carbs_g, fat_g, fiber_g, photo_url, logged_at, created_at
public.foods:         id, name, brand, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, is_custom, created_by (user_id), created_at
public.meal_plans:    id, user_id, plan_data (jsonb), start_date, end_date, ai_generated, created_at
public.grocery_lists: id, meal_plan_id, item_name, category, checked, created_at
```

---

## 12. AI Fitness Coach (`/app/ai-coach`)

### Chat Interface
- Full-screen dark chat UI with cyan (`#00E0FF`) accent colors throughout.
- Left sidebar: Conversation threads list (newest first). "New Chat" button at top. Each thread shows first message preview, timestamp.
- Main area: Message list (auto-scroll to bottom), input bar at bottom.

### Message Design
- User messages: right-aligned, green background (`#8BC000`), black text, rounded-2xl rounded-tr-sm.
- AI messages: left-aligned, `#111111` background, green border-left (3px), rounded-2xl rounded-tl-sm, white text.
- AI avatar: HFC logo icon (small, cyan glow).
- User avatar: user's profile picture (fallback to initials).

### AI  (Edge Function)
The Edge Function sends this context to Claude API with every request:
```
You are "HFC Coach" — an expert AI fitness coach for HFC (Holistic Fitness Club).

User Profile:
- Name: {nickname}
- Goals: {fitness_goals}
- Activity Level: {activity_level}
- Weight: {weight_kg}kg, Height: {height_cm}cm, BMI: {bmi}
- Diet: {diet_preference}, Allergies: {allergies}
- Current Streak: {streak_current} days (best: {streak_best})
- Recent Workouts: {last_5_workouts_summary}
- Recent Codex: {last_7_codex_entries}
- Recent PRs: {recent_prs}
- XP: {xp}, Level: {level}

Guidelines:
- Be encouraging, specific, and evidence-based.
- Reference their actual data (streak, recent workouts, goals).
- Never give medical advice — always suggest consulting a doctor for health concerns.
- For workout plans: include sets, reps, rest times, and progressions.
- For nutrition: respect their diet preference and allergies strictly.
- Keep responses concise (max 300 words) unless detailed plan requested.
- Use emoji sparingly (max 2 per response).
```

### Features
- **Typing Indicator:** 3-dot bouncing animation while waiting for AI response (simulate 500–1500ms delay for realism).
- **Suggested Prompts:** 4 quick-action buttons below input: "Build me a 4-week plan", "Why am I tired?", "Post-workout meal ideas?", "How do I break my plateau?".
- **Markdown Rendering:** Messages rendered with `react-markdown` — bold, italic, lists, code blocks, tables.
- **Multimodal Upload:** 📎 button opens file picker (images only, max 5MB). Image sent to Claude Vision API for form-check analysis: "Your squat depth looks good but try to keep your chest up more."
- **Tool Use:** AI can call internal Edge Functions via structured tool definitions:
  - `log_workout` — Create a workout entry.
  - `schedule_workout` — Schedule workout for tomorrow.
  - `get_user_stats` — Fetch current stats.
  - `create_meal_entry` — Log a meal.
  - `generate_meal_plan` — Trigger meal plan generation.
- **Memory:** Store conversation facts in `public.coach_memory`:
  ```
  id, user_id, thread_id, key (e.g. "allergy_peanuts"), value, created_at, updated_at
  ```
  AI reads this memory at the start of each conversation. "I remember you're allergic to peanuts — let me suggest alternatives."

### Rate Limiting
- Free users: 50 messages/day (tracked in `profiles.ai_messages_today`, reset daily via cron).
- Premium/Paying: Unlimited (configurable via `feature_flags` table).
- Show "Daily limit reached — upgrade for unlimited AI coaching!" message when limit hit.

### Voice Input/Output
- 🎤 Microphone button → Web Speech API (`webkitSpeechRecognition`) → transcribes to input.
- 🔊, Speaker button on AI responses → `speechSynthesis.speak()` with a pleasant voice.
- Toggle in settings to enable/disable voice.

---

## 13. Achievements & Badges (`/app/achievements`)

### Badge Categories (100+ Seeded Badges)

**Streak Category (12 badges):**
- Beginner (1-day streak) — Common
- Consistent (3-day streak) — Common
- On Fire (7-day streak) — Rare
- Unstoppable (14-day streak) — Rare
- Warrior Month (30-day streak) — Epic
- Century (100-day streak) — Legendary
- Comeback Kid (restored streak with freeze) — Rare
- Perfect Day (all 9 habits) — Rare
- Perfect Week (7 perfect days in a row) — Epic
- Perfect Month — Legendary
- New Year, New You (first workout Jan 1) — Special
- Holiday Grind (workout on Christmas/New Year) — Special

**Strength Category (15 badges):**
- First Steps (first workout logged) — Common
- Getting Stronger (first PR) — Common
- Warrior Week (7 workouts in a week) — Rare
- Iron Will (20 workouts in a month) — Epic
- Century Club (100 total workouts) — Epic
- Beast Mode (500 total workouts) — Legendary
- Bench 100 (bench press 100kg) — Epic
- Deadlift 2x Bodyweight — Legendary
- Squat 2x Bodyweight — Legendary
- Pull-up Master (20 consecutive pull-ups) — Epic
- Marathon Finisher — Rare
- 5K Under 20min — Epic
- Plank 5 Minutes — Epic
- First Program Complete — Rare
- Program Machine (5 programs complete) — Epic

**Codex Category (8 badges):**
- Perfect Day ×1 / ×10 / ×50 — Rare/Epic/Legendary
- Codex Champion (90-day streak) — Legendary
- Early Bird (Codex before 6 AM) — Rare
- Night Owl (Codex after 11 PM) — Special

**Community Category (10 badges):**
- First Post — Common
- Social Butterfly (50 posts) — Rare
- Helpful Member (20 comments) — Rare
- Motivator (100 likes received) — Rare
- Influencer (500 likes) — Epic
- Event Organizer — Rare
- Challenge Champion — Epic
- Group MVP — Rare
- Mentor's Favorite — Special
- HFC Ambassador — Legendary

**Consistency Category (8 badges):**
- 7-Day Streak — Rare
- 30-Day Streak — Epic
- 90-Day Streak — Legendary
- Weekend Warrior — Rare
- Monthly Dedication — Epic
- Year of Fitness — Legendary
- Comeback (returned after 30-day break) — Rare
- Multitasker (Codex + Workout on same day, 7×) — Rare

**Special Category (15 badges):**
- Birthday PR (PR on birthday) — Special
- Holiday Warrior (workout on 3+ holidays) — Special
- Full House (all 9 habits on 3 consecutive days) — Special
- Night Shift (workout between 12AM–5AM) — Special
- Early Bird (workout before 6AM) — Special
- Social Distancer (solo 5K during pandemic vibes) — Humor/Special
- etc.

### Badge Card Design
- Card: `bg-[#111111] border-2 rounded-3xl p-5 text-center`.
- **Earned:** Border `#8BC000` (green), icon at top with `badgeGlow` animation, name below, description in gray.
- **Locked:** Border `#333`, icon grayscale + opacity-30, lock icon overlay (Lucide Lock), name in gray.
- **Progress bar on locked badges:** "3/7 workouts to earn 'Warrior Week'" with thin green progress bar.
- Hover: `-translate-y-1` lift, green shadow glow.
- **On newly earning:** Page-level `confettiFall` from top + `celebrationBounce` on the specific badge card + Sonner toast "🏆 New Badge: Warrior Week!" + auto-post to community feed.

### Badge Logic (Edge Function)
- `check_achievements(user_id)` — runs after every significant action (workout logged, codex completed, PR achieved). Checks all badge conditions. Awards new badges via `public.user_achievements` insert. Returns list of newly earned badges for UI celebration.

---

## 14. Leaderboard (`/app/leaderboard`)

### Tabs
- Global / My Group / Friends / This Week / This Month / All-Time.

### Podium (Top 3)
```
        [🥇 #1 — Gold Block]        ← 140px tall, crown icon + floatBounce
  [🥈 #2 — Silver Block] [🥉 #3 — Bronze Block]    ← 100px and 80px tall
```
- Each block: rank number large, avatar, name, streak score, XP, score breakdown.
- Gold: `bg-[#FFD700]` border, shadow glow.
- Silver: `bg-[#C0C0C0]` border.
- Bronze: `bg-[#CD7F32]` border.
- All with avatar image (circular, 48px).

### Table
- Below podium: ranked table of all members (paginated, 20 per page).
- Columns: Rank, Avatar, Name, Streak, XP, Level, Codex %, Workouts, Score.
- Current user row: highlighted with `bg-[rgba(139,192,0,0.1)]` + sticky "YOU" badge (green pill, pinned on scroll with `position: sticky`).
- Sort by Score (default) or individual columns.
- Score formula (weighted):
  ```
  score = (streak_current × 10) + (xp × 1) + (prs_achieved × 50) + (workouts_completed × 20) + (perfect_days × 100)
  ```

### Reset Countdown
- "Weekly reset in: 2d 14h 32m" — live countdown timer updating every second.
- On reset: clear weekly scores, notify all users.

### Filtering
- By group/brigade dropdown.
- By role (exclude admins/mentors from member leaderboard by default).

---

## 15. Junior Warriors (`/app/kids`) — Gamified Kids Fitness

### Visual Theme
- Navy blue (`#0A0A2E`) starfield background (CSS stars + animated shooting stars).
- Nunito font everywhere.
- Comic-book style: thick borders, rounded shapes, bright accent colors (green, blue, yellow, purple).
- Sound effects (optional): Whoosh on action, chime on achievement.

### Warrior Levels (XP-Based)
| Level | Name | XP Required | Visual |
|-------|------|-------------|--------|
| 1 | 🌱 Recruit | 0 | Small green star |
| 2 | ⚔️ Squire | 100 | Blue shield |
| 3 | 🛡️ Warrior | 300 | Silver sword |
| 4 | 🏅 Captain | 600 | Gold crown |
| 5 | 👑 General | 1000 | Purple royal crest |
| 6 | 🐉 Legend | 2000 | Dragon emblem |

### Daily Habits (6 Cards)
1. 🕐 **Punctual** — Arrived on time (checked by mentor/parent)
2. 💪 **Exercise** — Completed daily workout
3. 💧 **Water** — Drank 8 glasses
4. 😴 **Sleep** — Slept 9+ hours
5. 🛏️ **No Screens Before Bed** — No screens 1hr before sleep
6. 🧹 **Clean Gear** — Kept workout space tidy

- Each card: icon, name, check toggle, 7 progress dots (M T W T F S S) for the week.
- Checked: green card, bounce animation. Unchecked: dark card, gray icon.

### Star System
- Each completed habit = +1 star ⭐.
- Bonus stars: perfect day (+3), weekly perfect (+10), level-up (+5).
- Stars stored in `public.kids_stars`.

### Mini-Games
- **"Plank Hero"** — Face camera (frontend stub for pose detection), hold plank position, timer counts up. "Your plank lasted 45 seconds! +5 stars ⭐" with star-burst animation.
- **"Squat Quest"** — AI counts squats via video (stub, shows "Coming Soon: AI-Powered Rep Counter"). User taps "I did N squats" for manual logging.
- **"Hydration Hero"** — Tap water drops to fill a tank, visual fill animation.

### Pet System
- Hatch an egg after first login (animation: egg cracks → creature appears).
- Creature evolves based on consistency: Egg → Baby → Teen → Adult → Elder Dragon.
- Show pet on dashboard card with mood based on recent habits ("Buddy is happy! 🎉" / "Buddy misses you 😢").
- Pets stored in `public.kids_pets`: id, user_id, name (user-chosen), stage, xp, last_fed_at, created_at.

### Parent Dashboard (Linked Parent Account)
- Parent role (`parent`) can link to child via `profiles.parent_id` FK.
- Parent sees: Child's daily habits, streaks, stars, pet status, upcoming events.
- Actions: Approve milestone, send encouragement (stored notification), set screen-time limit.
- Weekly email summary (Edge Function cron) to parent.

### Persistence
```
public.kids_daily:  id, user_id, entry_date, punctual boolean, exercise boolean, water boolean, sleep boolean, no_screens boolean, clean_gear boolean, stars_earned, created_at
public.kids_stars:  id, user_id, total_stars, stars_today, streak_days, created_at, updated_at
public.kids_pets:   id, user_id, pet_name, stage (1-5), pet_xp, mood, last_fed_at, created_at
```

---

## 16. Community Feed (`/app/community`)

### Feed Design
- Infinite scroll feed (virtualized list via `react-virtuoso` for performance).
- Post types: Text, Photo, Workout Summary (auto-posted from workout completion), Badge Unlock (auto-posted), PR Celebration (auto-posted).

### Post Card
- Author: avatar (32px circular), name, nickname pill, timestamp (relative: "2h ago").
- Content: text + image/video (if any), workout badge if type = workout_summary.
- Actions: ❤️ Like (with count), 💬 Comment (expandable thread), 🔄 Share, ⚠️ Report.
- Hashtags auto-linked (click to filter feed by hashtag).

### Create Post
- Floating "+" button (bottom-right, green, FAB style).
- Opens compose modal: rich-text editor (bold, italic, lists, link), image upload (Supabase Storage), emoji picker.
- Auto-detect workout completion → prompt "Share your workout?" with pre-filled summary.
- Auto-detect badge earned → prompt "Celebrate your new badge?" with pre-filled content.

### Moderation
- Report button → sends to `public.reported_content` with reason dropdown.
- Admin moderation queue in Admin Panel tab "Content Moderation".
- Actions: Delete post, Warn user, Ban user (all logged to audit_log).

### Filters
- Following / My Group / All (global).
- Hashtag filter (click tag → filtered view).
- Sort: Latest / Popular (most likes) / Top (most engagement in time window).

---

## 17. Group Chat (`/app/chat-panel`)

### Channel Types
- **Group Channels:** `#general` (all members), `#legday` (fitness discussion), `#nutrition` (meal sharing), `#motivation` (daily quotes/encouragement), per-group channels (`#group-{group_id}`).
- **Direct Messages:** 1:1 conversations between any two users.

### Chat UI
- Left sidebar: channel list (group channels top, DMs below with online indicator green dot).
- Main area: message list (Supabase Realtime subscription for live updates).
- Bottom: message input with emoji picker, attachment button (image/file/voice note).

### Message Features
- Text messages, image attachments (Supabase Storage), file attachments, voice notes (recorded via MediaRecorder API, stored in Storage).
- Timestamps: relative (2m ago, 1h ago) / absolute on hover.
- Read receipts: ✓ (sent) ✓✓ (delivered) ✓✓ blue (read by all in group / read by recipient in DM).
- Typing indicator: "{name} is typing..." with animated dots.
- Online status: green dot next to name (last seen < 5 min), yellow (< 30 min), gray (> 30 min).

### Push Notifications
- Web Push API for offline notifications.
- "New message in #general from {name}: ..."
- Store notification preferences in `public.notification_prefs`.

### Search
- Search within current thread by keyword.
- Global search in Command Palette (Cmd+K).

### Persistence
```
public.chat_channels:   id, name, type (group/dm), created_by, created_at
public.chat_members:    id, channel_id, user_id, joined_at
public.chat_messages:   id, channel_id, user_id, content, attachment_urls (text[]), type (text/image/file/voice), read_by (jsonb), created_at
```

---

## 18. Events & RSVP (`/app/events`)

### Calendar Views
- Month view (full calendar grid), Week view (7-column time grid), Agenda view (chronological list).
- Events color-coded by type: Group Session (green), Workshop (cyan), Challenge (purple), Social (yellow).

### Event Creation (Admin/Mentor Only)
- Form: Title, Type dropdown, Description (rich text), Cover image upload, Date & Time (start/end), Location (text or "Online" with meeting link), Capacity (number), RSVP Deadline, Tags.
- Auto-generates Google Calendar `.ics` file for download.

### Event Card
- Cover image (banner), title, date/time, location, host name, capacity bar (X/Y spots filled), RSVP status buttons.
- Countdown timer for upcoming events ("Starts in 2d 5h 30m").
- Attendee list with avatars.

### RSVP System
- Buttons: ✅ Going / 🤔 Maybe / ❌ Can't Go.
- Capacity management: "X spots left!" warning when near capacity. "Waitlist" option if full.
- Reminder notifications: 1 day before and 1 hour before (via notification queue).
- Post-event: prompt "How was the event?" (1–5 rating + comment).

### Past Events
- Gallery section: photos uploaded during/after event.
- Attendance summary: X went, Y maybe, Z didn't.

### Persistence
```
public.events:         id, title, type, description, cover_image_url, start_at, end_at, location, online_link, capacity, created_by (mentor_id), tags (text[]), created_at
public.event_rsvps:    id, event_id, user_id, status (going/maybe/cant), rating, feedback, created_at
```

---

## 19. Challenges (`/app/challenges`)

### Challenge Creation (Admin/Mentor)
- Title, Description, Cover image, Duration (7d/14d/30d/custom), Type (Steps / Workouts / Codex / Custom), Goal (e.g. "100 squats", "5 workouts"), Prize (credits amount, badge), Start date, End date.
- Visibility: Group only / All members.

### Challenge Page
- Active challenges card: Title, progress bar (X/Y), days remaining, participants count, prize.
- "Join Challenge" button (if not joined).
- **Progress logging:** "Log Progress" button → enter current value → updates progress bar.
- Per-challenge mini-leaderboard: top 5 participants with their progress.
- Challenge feed: participants can post updates (linked to community).

### Challenge Types
- **Workout Challenge:** Complete N workouts in X days.
- **Codex Challenge:** Maintain N-day streak in X days.
- **Steps Challenge:** Reach N steps/day for X days (manual entry or wearable stub).
- **Custom Challenge:** Admin-defined metric with progress tracking.

### Completion
- On reaching goal: Award badge (auto via `check_achievements`), prize credits (auto-add to `profiles.credits`), celebration animation, auto-post to community.

### Archive
- Past challenges list with results (winner, completion stats, participants).
- Historical leaderboard preserved.

### Persistence
```
public.challenges:         id, title, description, type, goal_type, goal_target, duration_days, prize_credits, prize_badge_id, created_by, starts_at, ends_at, visibility, created_at
public.challenge_entries:  id, challenge_id, user_id, current_progress, completed, completed_at, joined_at, created_at
```

---

## 20. Gallery (`/app/gallery`)

### Masonry Grid
- Pinterest-style masonry layout (CSS columns or react-masonry-css).
- Images from Supabase Storage, lazy-loaded with blur-up placeholder.
- Click opens lightbox (dark overlay, image centered, prev/next arrows, keyboard navigation).

### Albums & Tags
- Auto-created albums: "Event: {event_title}", "Workout: {date}", "Team {group_name}".
- User-defined albums (create, rename, delete).
- Tag system: #event, #workout, #teambuilding, #fun, #training.

### Upload
- Drag-and-drop upload zone (green dashed border, upload icon).
- Multi-select images, upload progress bar per file.
- Caption + tags on upload.
- EXIF data stripped server-side (Edge Function or Supabase Storage transform) for privacy.
- Max file size: 10MB per image. Formats: JPG, PNG, WebP.

### Interactions
- Like (heart icon, count), Comment (thread), Download (downloads original from Storage).
- Report image for moderation.

### Moderation
- Admin moderation queue for reported images.

### Persistence
```
public.gallery_items: id, user_id, album_id (nullable), image_url, thumbnail_url, caption, tags (text[]), likes_count, created_at
public.gallery_albums: id, user_id, name, cover_image_url, created_at
```

---

## 21. Health Logs (`/app/health-logs`)

### Mood Log
- Daily mood entry: 1–10 slider with emoji labels (😢 → 😐 → 🙂 → 😊 → 🤩).
- Optional note: "What's on your mind?" (500 char textarea).
- Calendar view: color-coded dots per day (green = great, yellow = okay, red = rough).

### Vitals Log
- Blood Pressure: systolic/diastolic (mmHg).
- Resting Heart Rate: BPM.
- Blood Glucose: mg/dL (fasting / post-meal).
- Body Temperature: °C.
- Logged with timestamp, shown in trend charts (Recharts line chart).

### Sleep Log
- Bedtime, Wake time, Total hours (auto-calculated), Sleep quality (1–5 stars).
- Sleep stages (placeholder): Awake, Light, Deep, REM (manual entry for now).
- Sleep score calculation: (total hours × 20) + (quality × 10) = out of 100.

### Medication Tracker
- Add medication: name, dosage, frequency (once/twice/thrice daily), times, start date, end date (optional), notes.
- Daily checklist: "Did you take {name}?" with timestamp.
- Missed dose alert: notification if not checked off by scheduled time.

### Trends
- Recharts charts for each metric over time (1W / 1M / 3M / 6M / 1Y).
- Correlations: "On days you sleep 7+ hours, your mood averages 8.2 vs 5.1 on <5h nights."

### Export
- Generate PDF health report (use `jspdf` + `jspdf-autotable`) with all metrics, charts as images, date range selector.

### Persistence
```
public.health_logs:    id, user_id, type (mood/vitals/sleep/medication/weight), data (jsonb), logged_at, created_at
public.medications:    id, user_id, name, dosage, frequency, times (text[]), start_date, end_date, notes, active, created_at
```

---

## 22. Inventory (`/app/inventory`)

### Equipment Management (Admin/Mentor)
- CRUD for items: Name, Category, Image, Quantity total, Condition (New/Good/Fair/Needs Repair), Location.
- Categories: Weights, Machines, Mats, Accessories, Electronics, Apparel.

### Check In/Out Flow
- User requests item → Mentor/Admin approves → status → "Checked Out".
- Auto-due date: 7 days from checkout. Overdue alert.
- Return flow: User returns → Admin checks condition → status → "Available" or "Needs Repair".
- Per-item history log: who checked out, when, returned, condition notes.

### Status Dashboard
- Cards showing counts per status: Available (green), Checked Out (yellow), Maintenance (orange), Retired (red).
- Overdue items list (red highlight).

### User View
- Browse available items, request checkout.
- My checkouts list with due dates.
- Return button.

### Persistence
```
public.inventory_items:  id, name, category, image_url, total_qty, available_qty, condition, location, created_at
public.checkouts:        id, item_id, user_id, checked_out_by (mentor_id), checked_out_at, due_at, returned_at, condition_on_return, notes, status, created_at
```

---

## 23. Library (`/app/library`)

### Content Library
- Curated content across 4 categories: Books 📖, Videos 🎬, Articles 📝, Podcasts 🎧.
- Admin/Mentor add content: Title, Author/Creator, Category, URL (YouTube/Article link), Cover image, Description, Tags, Recommended for goals.
- 50+ pre-seeded items (fitness books, YouTube channels, nutrition articles, science podcasts).

### Reading/Watching Tracker
- Per-user status: Want to Read / In Progress / Completed / Dropped.
- Progress tracking: For books → pages read / total pages. For videos → watched %. For articles → read/unread.
- Personal notes per item (rich text, private).

### Recommendations
- "Recommended for You" section based on user's `fitness_goals`.
- "Popular this week" based on community engagement.
- "New Additions" sorted by creation date.

### Shelves
- Create personal shelves/collections: "Strength Essentials", "Nutrition Deep Dive", "Morning Motivation".
- Drag-and-drop reorder within shelf.

### Persistence
```
public.library_items:     id, title, creator, type, url, cover_url, description, tags, recommended_for (text[]), created_by, created_at
public.library_progress:  id, user_id, item_id, status, progress_pct, notes, started_at, completed_at, created_at, updated_at
```

---

## 24. Store & Credits (`/app/store`)

### Earning Credits
| Action | Credits Earned |
|--------|---------------|
| Daily Codex completed | +10 |
| Perfect Day (all 9 habits) | +50 bonus |
| Workout logged | +20 |
| New PR achieved | +50 |
| Challenge completed | +100 |
| Badge earned | +25 per badge |
| Referral signup (referee confirms) | +200 |
| Weekly streak (every 7 days) | +30 bonus |
| Post in community | +5 per post |
| Comment | +2 per comment |

### Spending Credits
| Item | Cost |
|------|------|
| HFC T-Shirt | 500 |
| HFC Water Bottle | 300 |
| 1-on-1 Training Session (30 min) | 800 |
| Premium AI Coach (1 month) | 1000 |
| Custom Workout Plan | 600 |
| Nutrition Consultation | 700 |
| Supplements Pack | 400 |
| Group Session Pass | 350 |
| Custom Badge | 1000 |

### Store UI
- Product grid with image, name, description, price (in credits), "Buy" button.
- Cart (sidebar slide-out), checkout flow (mock — deducts credits, creates order record, shows confirmation).
- Order history list.
- Credit balance displayed prominently in header + store page.

### Admin Panel (Store Management)
- Add/edit/remove products.
- Set prices, upload images.
- View sales analytics.

### Persistence
```
public.products:   id, name, description, price_credits, image_url, category, stock (integer), active, created_at
public.orders:     id, user_id, product_id, credits_spent, status (pending/fulfilled/cancelled), created_at
```

---

## 25. About Page (`/app/about`)

### Tabs: About | Groups | Trainers | Members

#### About Tab
- **Hero:** "About HFC" heading, mission statement in large italic text.
- **Story Timeline:** Vertical timeline with milestones (Founded, First 100 members, First Event, etc.) — each with date, title, description, optional image.
- **Values Cards:** 4 cards — Integrity, Community, Growth, Fun. Each with icon + description.
- **Testimonials:** 6 testimonial cards with member avatar, name, nickname, quote, streak count, date.
- **Contact Section:** Email, phone, address, map placeholder, social media links.
- **Photo Grid:** 6–8 images from gallery showing club activities.

#### Groups Tab
- Group cards grid: Banner image (gradient placeholder), group name, member count, mentor name, "Join" button (if not a member).
- Expandable cards: Click to expand → shows member avatars + names, trainer avatar + name, group stats (avg streak, top performer).
- **Admin/Mentor Controls:** Add Group button → form (name, description, banner color/gradient, max members). Edit/Delete on each card.
- Search/filter groups.

#### Trainers Tab
- Trainer cards: Large avatar, full name, trainer code (unique, display like "#HFC-001"), specialty (Strength/Cardio/Yoga/Nutrition/etc.), certifications (tags), groups assigned (chip badges), bio, rating (star rating, editable by users), "Book Session" CTA.
- **Admin Controls:** Add Trainer form (name, phone, email, specialty, certifications, bio, photo upload, multi-select group assignment). Edit/Delete.
- Trainer detail page (click card): Full profile, assigned groups, member list, session history.

#### Members Tab
- Shows only users with `user` role (filters out admins, mentors, parents).
- **Member Card:** Avatar, full name, nickname as primary-colored pill (`bg-[#8BC000] text-black px-2 py-0.5 rounded-full text-xs font-bold`), streak count, XP, level, trainer name, group name.
- **Search:** Debounced search by name, phone, trainer, group.
- **Sort:** Name A-Z/Z-A, Phone, Trainer, Group, Streak (high/low), XP (high/low).
- **Group → Trainer Cascade:** Select a group → trainer dropdown filters to only trainers assigned to that group. Select a trainer → shows their assigned groups.
- **Inline Edit:** Click nickname/group/trainer on any member row → inline dropdown/edit → save (auto-saves, debounced).
- **Quick View:** Click member card → drawer with full profile summary, streak graph, recent workouts, Codex status.

---

## 26. Profile Page (`/app/profile`)

### Layout: 2-Column (Desktop), Single Column (Mobile)
- Left column (40%): Avatar section + stats overview.
- Right column (60%): Edit forms in collapsible sections.

### Avatar Section
- Large circular avatar (128px) with camera overlay button (opens file picker, uploads to Supabase Storage).
- Fallback: First letter of username on green circle.
- Level badge overlay: "Lvl {level}" in top-right corner of avatar.

### Stats Panel
- 4 stat cards: Streak 🔥 (N days, best N), Workouts 💪 (N total), PRs 🏆 (N total), Credits ⭐ (N).
- Rank: "#{global_rank} globally" with podium position if top 3.

### Account Section (Read-Only)
- Email: `user@example.com`
- Username: `{Title Case}` — gray text, copy button.
- Insta ID: `@{social_handle}` — or "Not set"
- Mentor: `{mentor_name}` — tooltip "Your Trainer"
- Brigade Unit: `{group_name}` — tooltip "Your Group"
- Role badge: colored pill showing current role.
- Member since: `{joining_date}` formatted.

### Notification Preferences (Collapsed by Default)
- Expandable section with toggles:
  - 🔔 Codex Reminder (daily at 8 AM)
  - 💬 New Message (chat notifications)
  - 📊 Weekly Report (Sunday summary)
  - 🎯 Challenge Invites
  - 🏆 Badge Earned
  - ✨ AI Coach Suggestions
  - 📢 Club Announcements
  - 📧 Email Digest (weekly)

### Diet Section
- Current Diet select: Veg / Non-veg / Vegan / Pescatarian / Others.
- If "Others" selected → show free-text input: "Please specify:".

### Editable Fields (Form Sections)
- **Personal Info:** Full name, Phone (with validation), Birthday (date picker), Gender (select).
- **Body Metrics:** Height (cm), Weight (kg), Activity Level (select), Fitness Goals (multi-select chip grid).
- **Health Info:** Medical Conditions (tag input), Allergies (tag input), Past Injuries (textarea), Medications (textarea).
- **Lifestyle:** Average Sleep Hours (number input), Average Hydration (liters, number input).

### Privacy Section
- Profile visibility: Public / Group Only / Private.
- Who can message: Everyone / Group Members / Mentors Only / No One.
- Streak visibility: Show / Hide from leaderboard.
- Activity status: Show / Hide online status.

### Connected Accounts
- Google (connected / connect button).
- Apple (connected / connect button).

### Danger Zone
- "Download My Data" → generates JSON export of all user data → downloads as file.
- "Delete Account" → confirmation modal → soft delete (30-day restore window) → sends confirmation email.

---

## 27. Settings (`/app/settings`)

### Account Settings
- Change Password: current + new + confirm.
- Change Email: current + new + confirm (requires re-verification).
- Two-Factor Authentication: Toggle → shows TOTP QR code (via `otpauth` URI), backup codes (generate once, show once, hash-store).
- Active Sessions: List of logged-in devices with IP, location (placeholder), last active, "Revoke" button.
- Timezone selector (IANA timezone dropdown).

### Appearance
- Animation intensity: Full / Subtle / Off (disable all non-essential animations).
- Sound Effects: On / Off (click sounds, achievement chimes).
- Font size: Small / Medium / Large.

### Language & Region
- Language: English (default), Spanish, Hindi, French (pre-seeded).
- Date format: DD/MM/YYYY or MM/DD/YYYY.
- Time format: 12h or 24h.

### Privacy & Data
- Data Export: Same as profile page.
- Data Deletion: Same as profile page.
- Blocked Users: List of blocked users with "Unblock" button.

### Connected Integrations
- Google Fit (placeholder OAuth flow).
- Apple Health (placeholder).
- Fitbit (placeholder).
- Garmin (placeholder).
- Each with "Connect" / "Disconnect" / "Last synced" status.

### Billing (Placeholder)
- Subscription tier: Free / Premium ($9.99/month) / Pro ($19.99/month).
- Current plan card with features list.
- "Upgrade" / "Manage Subscription" buttons (mock).
- Invoice history (mock list).

---

## 28. Admin Panel (`/app/admin`)

Accessible only to `super_admin` and `admin` roles. Redirect others with "Access Denied" toast.

### Overview Tab
- **Role Distribution:** 4 cards (Super Admin, Admin, Mentor, User) with counts. Hover card → tooltip with member names.
- **New This Month:** `profiles` where `joining_date >= date_trunc('month', now())` → list with name, date, role.
- **No-Show Rate:** `(scheduled_sessions - attended) / scheduled_sessions * 100` for `user` role only. Display as percentage + trend.
- **Absent Users:** Profiles with `last_active_at < now() - interval '14 days'` and role = `user`. List with name, last active date, streak (may be broken).
- **Engagement Metrics:**
  - DAU: Distinct `auth.users` with `last_sign_in_at >= today()`.
  - WAU: Distinct `auth.users` with `last_sign_in_at >= now() - interval '7 days'`.
  - MAU: Distinct `auth.users` with `last_sign_in_at >= now() - interval '30 days'`.
  - Codex Completion Rate: `count(codex_entries where all_9_habits) / total_users * 100`.
  - Average Streak: `avg(streak_current)`.
- **Revenue Overview:** (Placeholder) Credits in circulation, store orders, revenue estimate.

### User Monitoring & Analytics Tab
- User table: name, email, role, last active, streak, XP, workouts logged, PRs, level.
- Hover over login count → tooltip showing all login timestamps (`auth.users.last_sign_in_at` history).
- Filter by role, group, date range, activity status (active/inactive).
- Export filtered data as CSV.
- Cohort analysis chart: Signup month → retention %.

### Audit Log Tab
- Filterable table: Date range, actor, target, action type, path.
- Columns: Timestamp, Actor, Actor Role, Target, Action, Path, Details (expandable JSONB viewer).
- Export as CSV.
- Color-coded rows: Red (access denied), Yellow (role change), Blue (permission change), Gray (info).

### Content Moderation Tab
- Reported posts/comments queue.
- Each item: reporter, reported content preview, reason, timestamp.
- Actions: Dismiss, Delete Content, Warn User, Ban User (all logged to audit_log).

### AI Coach Management Tab
- Set  template for AI Coach (textarea, live preview).
- Configure rate limits: Free tier messages/day, Premium tier (unlimited).
- View usage stats: Total messages today, by user, average response time.
- Token usage + cost estimate.

### Broadcast Tab
- Compose notification: Title, Message, Target (All / Group / Role), Schedule (Now / Specific date).
- Preview on right side (mobile + desktop mockup).
- Send → creates `public.notifications` entries for all target users + pushes via Web Push.

### Feature Flags Tab
- Table of feature flags: Name, Description, Enabled (toggle), Affected Roles.
- Pre-seeded: `ai_coach_enabled`, `nutrition_page_enabled`, `challenges_enabled`, `store_enabled`, `kids_section_enabled`, `community_feed_enabled`, `pwa_enabled`, `voice_input_enabled`.
- Toggle on/off instantly (no deploy needed) — checked in `feature_flags` table on page load.

### Database Tab
- Table sizes (row counts for each table).
- Recent migrations list.
- Backup status (placeholder: "Daily backups enabled, last backup: {timestamp}").

### Impersonation
- "Impersonate User" button → search user → confirm → creates session as that user.
- 15-minute auto-timeout. Banner across top: "👁️ Viewing as {nickname} — {time remaining} — Exit".
- All actions during impersonation logged to audit_log with `impersonate` action type.

### Persistence
```
public.audit_log:       id, actor_id, actor_role, target_id, target_type, action, path, details (jsonb), created_at
public.feature_flags:   id, name, description, enabled, affected_roles (text[]), created_at, updated_at
```

---

## 29. Mentors Directory (`/app/mentors`)

- Searchable grid of mentor cards.
- Filter by: Specialty (dropdown), Availability (Available / Busy), Group assignment.
- **Mentor Card:** Avatar (80px), Full name, Trainer code (#HFC-XXX), Specialty (badge), Certifications (small chips), Bio (2-line preview), Groups assigned (chips), Rating (⭐ X.X from N reviews), "Book Session" CTA.
- **Book Session (Mock):** Opens calendar picker (next 14 days), time slots (9 AM – 8 PM), session type dropdown (Consultation / Assessment / Follow-up / Custom). "Confirm Booking" → creates notification for mentor + user.
- Per-mentor stats: Members assigned count, Sessions completed, Average rating.
- Sort by: Name, Rating, Members count, Specialty.

---

## 30. Notifications System

### Notification Types
1. **Codex Reminder** — "Don't forget your daily Codex! 🔥" (daily at 8 AM)
2. **New Message** — "{name} sent you a message in #channel" (realtime)
3. **Badge Earned** — "🏆 You earned '{badge_name}'!"
4. **New PR** — "🏅 New PR on {exercise}: {value}!"
5. **Challenge Invite** — "{name} invited you to '{challenge}'"
6. **Event Reminder** — "{event}" starts in 24 hours
7. **Streak at Risk** — "Your {N}-day streak will break tonight!" (sent 2 hours before midnight)
8. **Weekly Report** — "Your weekly summary: {N} workouts, {N} habits, {N} PRs"
9. **AI Coach Suggestion** — "Coach has a new tip for you ✨"
10. **Club Announcement** — "HFC: {message}" (admin broadcast)

### In-App Notification Center
- Bell icon in header with red badge showing unread count.
- Click → dropdown panel (400px wide):
  - "Today" section (today's notifications).
  - "Earlier" section (this week).
  - Each notification: icon (color-coded by type), message text, timestamp, click action (navigate to relevant page).
  - "Mark all as read" button at bottom.
- Mark individual as read on click.

### Notification Channels
- **In-app:** Primary channel, stored in `public.notifications`.
- **Email:** Via Supabase Edge Function → Resend/SendGrid API (placeholder).
- **Push:** Web Push API (service worker push handler).
- **SMS:** (Optional) via Twilio API (placeholder Edge Function).

### Preferences
- Per-type toggle in Settings → stored in `public.notification_prefs`.
- Respects user's timezone for scheduled notifications.
- Quiet hours: 10 PM – 7 AM (configurable), suppress notifications during this window.

### Persistence
```
public.notifications:        id, user_id, type, title, message, data (jsonb), read, channel (in_app/email/push/sms), created_at
public.notification_prefs:   id, user_id, type (codex/message/badge/pr/challenge/event/streak/weekly/ai/announcement), channel (in_app/email/push/sms), enabled, created_at, updated_at
```

---

## 31. Search & Command Palette (Cmd/Ctrl+K)

### Activation
- Desktop: Cmd+K (Mac) / Ctrl+K (Windows/Linux).
- Mobile: Floating search icon in header (opens full-screen search).

### Search Modal Overlay
```
┌─────────────────────────────────────────────┐
│  🔍 Search anything...                       │  ← Input with green focus ring
│                                              │
│  Recent Searches                    ✕ Clear  │
│  ─────────────────────────────────────────  │
│  Pages:                                       │
│    → /app/workouts                    ⌘2      │
│    → /app/ai-coach                   ⌘6      │
│  Members:                                     │
│    → John Doe (Streak: 45 🔥)                 │
│    → Jane Smith (Mentor)                      │
│  Exercises:                                   │
│    → Bench Press (Chest)                      │
│    → Squat (Legs)                             │
│  Foods:                                       │
│    → Chicken Breast (165 cal)                 │
│    → Oatmeal (150 cal)                        │
│  Events:                                      │
│    → Saturday HIIT Session                    │
│  Badges:                                      │
│    → Warrior Week                             │
│                                              │
│  ↑↓ Navigate  ↵ Select  Esc Close            │
└─────────────────────────────────────────────┘
```

### Search Index
- Build search index client-side from data loaded via TanStack Query (deduplicate requests).
- Fuzzy search via `fuse.js` (lightweight, no server needed) or custom Levenshtein.
- Debounce input by 150ms.
- Keyboard navigation: ↑↓ arrows, Enter to navigate, Esc to close.
- Recent searches stored in localStorage (max 10 entries).

---

## 32. Internationalization (i18n)

### Supported Languages
- English (`en`) — default, fully translated.
- Spanish (`es`) — full translation.
- Hindi (`hi`) — full translation (Devanagari script).
- French (`fr`) — full translation.

### Implementation
- All UI strings use `t()` helper from `i18next` library.
- Translation files: `src/locales/en/common.json`, `es/common.json`, `hi/common.json`, `fr/common.json`.
- Categories: `common` (shared), `auth`, `codex`, `workouts`, `nutrition`, `community`, `admin`, `kids`.
- 200+ keys minimum per language.
- Date/number formatting via `Intl.DateTimeFormat` and `Intl.NumberFormat` based on locale.
- Language switcher in Settings page.
- Auto-detect browser language on first visit, allow override.
- RTL support placeholder (not required, but CSS logical properties for future-proofing).

---

## 33. Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- All interactive elements focusable via Tab.
- Custom focus ring: `focus:ring-2 focus:ring-[#8BC000] focus:ring-offset-2 focus:ring-offset-black` on all focusable elements.
- Skip-to-content link at top of every page.
- Modal/drawer trap focus (focus stays within open modal, Esc to close).
- Command palette fully keyboard navigable.

### Screen Reader Support
- ARIA labels on all icon-only buttons (e.g., `aria-label="Close"` on × button).
- ARIA live regions for dynamic content (new notifications, toast messages, streak updates).
- `role="status"` on loading indicators with `aria-live="polite"`.
- `role="alert"` on error messages with `aria-live="assertive"`.
- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`.
- Heading hierarchy: single `<h1>` per page, no skipped levels.

### Visual
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (test all combinations).
- `focus:visible` styles (no focus ring on mouse click, show on keyboard).
- Text resize up to 200% without layout break (use relative units: rem, em, %).
- Reduced motion: `@media (prefers-reduced-motion: reduce)` → disable all animations except essential ones.

### Forms
- Every input has associated `<label>` (or `aria-label`).
- Error messages linked via `aria-describedby`.
- Required fields marked with `aria-required="true"`.
- Success messages announced via `aria-live`.

---

## 34. PWA & Mobile Experience

### Progressive Web App
- `manifest.json`: name "HFC", short_name "HFC", theme_color `#000000`, background_color `#000000`, display standalone, orientation portrait-primary, start_url `/app`, icons (192px, 512px).
- Service Worker (via `@vite-pwa/vite-plugin`): Cache static assets, stale-while-revalidate for API calls, offline fallback page.

### Offline Support
- Show cached data when offline (TanStack Query + service worker cache).
- Queue mutations (workout log, Codex check) for sync when back online.
- Offline indicator banner: "You're offline — changes will sync when connected."
- Read-only mode for community, chat when offline.

### Install Prompt
- Custom "Install App" banner (not native browser prompt) with HFC branding.
- "Add to Home Screen" instructions for iOS (share → Add to Home Screen).
- Detect via `beforeinstallprompt` event.

### Mobile Optimizations
- Touch-friendly: minimum 44×44px tap targets.
- Swipe gestures: swipe left on post card → options menu, swipe right → back.
- Pull-to-refresh on feed pages.
- Bottom-safe-area padding for notched phones (`env(safe-area-inset-bottom)`).

---

## 35. Security, Privacy & Compliance

### Row Level Security (RLS)
- Every table in `public` schema must have RLS enabled.
- Each table has policies for SELECT, INSERT, UPDATE, DELETE per role.
- Policy pattern: `USING (has_role(auth.uid(), 'required_role') OR auth.uid() = user_id)`.
- Test all policies: admin can see all users' data in their group; users can only see their own data + group-public data.

### Data Protection
- Password fields: never stored, handled by Supabase Auth.
- `two_factor_secret`: encrypted at rest (pgcrypto or app-level encryption).
- `coach_memory.value`: sensitive user facts, consider encryption.
- `codex_entries.notes_encrypted`: user journal, encrypt before insert via Edge Function.
- All Supabase Storage buckets have RLS policies: users can only upload/read their own files.

### Rate Limiting
- Auth endpoints: 10 attempts/minute per IP (Edge Function middleware).
- AI Coach: 50 messages/day for free users (Edge Function checks daily count).
- API endpoints: 100 requests/minute per user (Edge Function middleware).
- Upload endpoints: 10 uploads/minute per user, max 10MB per file.

### Secrets Management
- All API keys (Anthropic, OpenAI, Resend, Twilio) stored as Supabase Edge Function secrets (`supabase secrets set`).
- Never in client code, never in `.env` files committed to Git.
- Lovable environment variables: set via Lovable dashboard → Backend → Secrets.

### Audit & Compliance
- All admin actions logged to `public.audit_log`.
- GDPR compliance: data export (JSON), account deletion (30-day soft delete), data portability.
- Data retention: soft-deleted records purged after 30 days (automated via cron).
- Daily encrypted database backups (Supabase automated backups).

### CSRF & XSS Protection
- Supabase Auth handles CSRF tokens automatically.
- Sanitize user-generated content (posts, comments) via DOMPurify before rendering.
- Content Security Policy headers (via Supabase Edge Function or Lovable deployment config).

---

## 36. Database Schema Summary

### Core Tables (35+ tables)
```
public.profiles          — User profile data (extensive fields listed in §3)
public.user_roles        — Role assignments (user_id, role)
public.groups            — Groups/brigades (name, description, banner_color, etc.)
public.user_groups       — Many-to-many: users ↔ groups
public.trainers          — Trainer profiles (name, code, specialty, certifications)
public.codex_entries     — Daily habit tracking (9 habits, streaks)
public.kids_daily        — Junior Warriors daily check-ins
public.kids_stars        — Kids XP and stars
public.kids_pets         — Kids pet system
public.workouts          — Workout sessions
public.workout_sets      — Individual sets within a workout
public.exercises         — Exercise library (100+ seeded)
public.personal_records  — PR tracking
public.body_metrics      — Weight, body composition over time
public.meals             — Meal log entries
public.foods             — Food database (1000+ seeded)
public.meal_plans        — AI-generated meal plans
public.grocery_lists     — Shopping lists from meal plans
public.coach_threads     — AI Coach conversation threads
public.coach_messages    — AI Coach chat messages
public.coach_memory      — AI Coach user memory/facts
public.posts             — Community feed posts
public.post_likes        — Post like tracking
public.post_comments     — Post comment threads
public.follows           — User follow relationships
public.chat_channels     — Chat channels (group + DM)
public.chat_members      — Channel membership
public.chat_messages     — Chat messages with attachments
public.events            — Club events
public.event_rsvps       — Event RSVP tracking
public.challenges        — Fitness challenges
public.challenge_entries — User challenge participation
public.gallery_items     — Photo gallery uploads
public.gallery_albums    — Photo album organization
public.health_logs       — Mood, vitals, sleep, medications
public.medications       — Medication schedules
public.inventory_items   — Equipment inventory
public.checkouts         — Equipment check in/out
public.library_items     — Books, videos, articles
public.library_progress  — User reading/watching progress
public.products          — Store products
public.orders            — Store purchase orders
public.notifications     — In-app notifications
public.notification_prefs — Notification channel preferences
public.achievements      — Badge definitions
public.user_achievements — Earned badges per user
public.badges            — Badge metadata
public.audit_log         — Security audit trail
public.referrals         — Referral code tracking
public.feature_flags     — Feature toggle flags
```

### Indexes
Every table must have at minimum: index on `user_id`, index on `created_at`. Composite indexes for common query patterns (e.g., `(user_id, entry_date)` on `codex_entries`, `(user_id, exercise_id, achieved_at)` on `personal_records`).

---

## 37. Edge Functions (Backend Logic)

All Edge Functions are Deno-based, deployed via `supabase functions deploy`, with typed Zod schemas for input/output validation.

| Function | Purpose | Trigger |
|----------|---------|---------|
| `ai-coach` | Proxy to Claude API with user context + memory | Called from React on each message |
| `meal-plan-generator` | Generate 7-day meal plan via Claude | User clicks "Generate Plan" |
| `form-check` | Analyze workout photo via Claude Vision | User uploads image in AI Coach |
| `pr-predictor` | Linear regression on PR history | Auto-runs after new PR |
| `notification-dispatcher` | Fan-out notifications (push/email/SMS) | Cron: every 15 minutes |
| `weekly-report` | Generate user weekly summary via Claude | Cron: Sunday 8 PM |
| `streak-watchdog` | Reset broken streaks, award freezes | Cron: Daily midnight |
| `open-food-facts` | Proxy barcode → nutrition lookup | User scans barcode |
| `health-report-pdf` | Generate PDF health report (jsPDF) | User clicks "Export PDF" |
| `image-transform` | Strip EXIF, resize, compress images | On upload to Storage |
| `auth-webhook` | Handle email confirmation events | Supabase Auth webhook |

---

## 38. Scheduled Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| `0 0 * * *` | streak-watchdog | Reset streaks, award monthly freezes |
| `0 20 * * 0` | weekly-report | Sunday 8 PM: weekly summary for all users |
| `0 8 * * *` | notification-dispatcher | Daily 8 AM: Codex reminders, streak alerts |
| `*/15 * * * *` | notification-dispatcher | Every 15 min: process notification queue |
| `0 0 1 * *` | monthly-reset | Monthly: reset daily counters, archive old data |

---

## 39. Testing Requirements

### Test Framework
- Vitest with `vitest.config.ts` (configure with jsdom environment for component tests).
- React Testing Library for component tests.
- MSW (Mock Service Worker) for API mocking.

### Test Suites (All Must Pass)
1. **Username Title Case:** `formatUsername("john doe")` → `"John Doe"`. Edge cases: "JOHN", "john", "  john  ", "john o'connor", "mary-jane watson".
2. **Auth Role Derivation:** `getUserRole(userId)` returns correct role. Test all 5 roles. Test nonexistent user → null.
3. **Route Access Matrix:** For every `/app/*` route, test each role can/cannot access. Use React Router `MemoryRouter` + `render` + `screen`.
4. **Unauthenticated Redirects:** Visit `/app/*` without auth → redirected to `/login`.
5. **Streak Calculations:** Consecutive days → streak increases. Gap → streak resets to 0. Freeze → streak preserved.
6. **BMI Calculation:** `weight_kg / (height_cm / 100)²` — test with known values.
7. **Calorie Calculator:** Mifflin-St Jeor equation — male/female, different activity levels.
8. **Score Formula:** Verify weighted leaderboard score matches formula.
9. **Audit Log Helpers:** `logAudit()` creates entry with correct actor, action, details.
10. **RLS Policy Tests:** Using Supabase local dev or test project — verify users can only access their own data.
11. **Edge Function Input Validation:** Send invalid Zod input → returns 400 error.
12. **Achievement Check:** Trigger workout → correct badges checked and awarded.
13. **Regression Tests:** Document and test 5+ previously fixed bugs (e.g., "streak didn't reset at midnight", "group filter showed admins", "avatar upload failed on mobile").

### Quality Gates
- All tests pass: `vitest run` → 0 failures.
- TypeScript: `tsc --noEmit` → 0 errors.
- Build: `vite build` → 0 errors, no warnings.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
- Browser console: 0 errors on all 5 main routes (check manually).

---

## 40. Performance Optimization

- **Code Splitting:** Every route lazy-loaded with `React.lazy()` + `Suspense` + skeleton loader.
- **Image Optimization:** Supabase Storage image transforms (width, quality, format webp). Lazy loading with Intersection Observer. Blur-up placeholder.
- **Search Debouncing:** 150ms debounce on all search inputs.
- **Virtualized Lists:** `react-virtuoso` for community feed, leaderboard table, chat messages (handles 10,000+ items smoothly).
- **Query Caching:** TanStack Query with `staleTime: 5min`, `gcTime: 30min`. Deduplicate identical requests.
- **Service Worker:** Cache static assets (HTML, CSS, JS, fonts). Stale-while-revalidate for API data.
- **Bundle Budget:** Initial JS < 200KB gzipped. Per-route chunk < 50KB gzipped.
- **Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1.
- **Font Loading:** `font-display: swap`, preload Montserrat (critical font).

---

## 41. Deployment & Publishing on Lovable

### Deploy Steps
1. In Lovable dashboard → click "Publish" button.
2. Configure environment: set Lovable Cloud (Supabase) connection — this is automatic if "Backend" was enabled during project creation.
3. Set environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (auto-populated by Lovable Cloud).
4. Edge Function secrets: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY` (set via Lovable → Backend → Secrets).
5. Custom domain: Lovable → Settings → Domains → add custom domain → configure DNS (Lovable provides CNAME record).
6. SSL: Automatically provisioned by Lovable (Let's Encrypt).
7. Enable GitHub sync: Lovable → Settings → GitHub → connect repo → enable auto-commit.

### Secrets (Never in Client Code)
```
SUPABASE_SERVICE_ROLE_KEY   → Edge Functions only
ANTHROPIC_API_KEY           → Edge Functions only
RESEND_API_KEY              → Edge Functions only (email)
TWILIO_ACCOUNT_SID          → Edge Functions only (SMS)
TWILIO_AUTH_TOKEN           → Edge Functions only
OPENAI_API_KEY              → Edge Functions only (fallback AI)
OPEN_FOOD_FACTS_API_KEY     → Edge Functions only
VITE_SUPABASE_URL           → Client-safe (public anon URL)
VITE_SUPABASE_ANON_KEY      → Client-safe (public anon key)
```

### Post-Deploy Checklist
- [ ] Protected routes remain gated (try accessing `/app/admin` without login).
- [ ] RLS policies active (try accessing another user's data via direct DB query).
- [ ] Supabase Auth email flow works (signup → verify → login).
- [ ] Google OAuth flow works.
- [ ] Edge Functions deploy and respond (test `ai-coach` with a simple message).
- [ ] Storage upload works (try uploading avatar image).
- [ ] Realtime works (send chat message, receive in real-time).
- [ ] PWA installs correctly (add to home screen on mobile).
- [ ] No console errors on any page.
- [ ] All tests pass in production build.

---

## 42. Out-of-Scope (Explicitly Not Building)
- Native iOS/Android apps — PWA only.
- Real payment processing — Stripe/PayPal integration is stubbed (mock checkout).
- Real SMS sending — Twilio integration stubbed.
- Live wearable integration (Apple Watch, Fitbit) — UI placeholder only, no actual sync.
- Multi-tenant white-labeling — single tenant, single club.
- Admin-controlled user-generated content moderation AI — manual moderation only.
- Video streaming — only video links/embeds, no hosted video.

---

## Goal

Produce a **premium, cinematic dark-theme fitness club application** with:

- Role-based access control (5 roles) with comprehensive admin panel.
- Gamified habit tracking (9 habits, streaks, XP, levels, freeze tokens).
- Full workout library + live logger + programs + templates + voice input.
- Progress charts, PR tracking, body metrics, photo progress, PR prediction.
- AI-powered coaching (Claude API chat with memory, multimodal, tool-use, voice I/O).
- Nutrition tracking (meals, macros, water, barcode scan, AI meal plans, grocery lists).
- Real-time community features (feed, group chat, events, challenges).
- Kids section with gamified habits, pet system, mini-games, parent dashboard.
- 100+ achievements with rarity tiers and celebration animations.
- Global + group leaderboard with weighted scoring and podium.
- Store with credit economy.
- Health logs (mood, vitals, sleep, medications) with PDF export.
- Equipment inventory management.
- Curated content library with progress tracking.
- Complete notification system (in-app, email, push, SMS).
- Global search & command palette.
- i18n (4 languages), full accessibility (WCAG 2.1 AA), PWA with offline support.
- Comprehensive testing (Vitest), security (RLS, audit log, rate limiting), performance optimization.
- Deployed on Lovable.dev with Lovable Cloud backend.

The app must feel like a **premium fitness brand** — every pixel matters. Dark, powerful, energetic, with neon green as the signature color that ties every screen together into a cohesive, addictive, holistic wellness experience.

---
