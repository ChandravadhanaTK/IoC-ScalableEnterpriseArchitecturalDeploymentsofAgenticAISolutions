Here is a complete, ready-to-use prompt for rebuilding the HFC — Holistic Fitness Club application from scratch:

---

Build the HFC — Holistic Fitness Club App

1. Tech Stack
- Framework: TanStack Start v1 with React 19, Vite 7, and TypeScript.
- Styling: Tailwind CSS v4 using CSS `@theme` variables in `src/styles.css`.
- Backend/Auth: Lovable Cloud (Supabase): Postgres, Row Level Security (RLS), Supabase Auth, Storage.
- Charts: Recharts with green (`#8BC000`) animated lines/bars.
- Icons: Lucide React.
- Fonts: Montserrat (Google Fonts) for the main app; Nunito for the Kids section.

2. Global Design System (Apply Everywhere)
- Background: `#000000` on every page.
- Cards: `#111111` with `1px` border `rgba(139, 192, 0, 0.15)`, rounded-3xl, hover lift and green glow.
- Card Alt: `#0D0D0D`.
- Primary: `#8BC000` for buttons, accents, glows, highlights.
- Hover Primary: `#A4D900`.
- Text Primary: `#FFFFFF`.
- Text Secondary: `#888888`.
- Inputs: Background `#1A1A1A`, border `#2A2A2A`, white text, green 3px focus ring, gray placeholders.
- Buttons: Primary buttons use `#8BC000` background, black bold text, hover scale/glow, 0.2s transition.
- Font: Montserrat 900 for headers, 700 for subheadings, 500 for body.
- Scrollbars: black track, green thumb, 5px width.
- Animations: Add global keyframes: `fadeIn`, `slideUp`, `scaleIn`, `floatBounce`, `glowPulse`, `streakGlow`, `confettiFall`, `checkBounce`, `countUp`, `badgeGlow`, `celebrationBounce`. Use ease-out, 200ms–500ms durations.

3. Authentication & Roles
- Implement email/password and Google OAuth sign-in using Supabase Auth.
- Roles (exactly 3): `admin`, `mentor` (includes trainers), and `user` (members).
- Create a `profiles` table in the `public` schema linked to `auth.users(id)` with cascade delete.
- Auto-create a profile on signup using a database trigger.
- Profiles fields: username (unique, title-case display), full_name, nickname, phone, email, role, group_id, trainer_id/mentor_id, avatar_url, birthday, height, weight, diet, activity_level, fitness_goals, credits, referral code, social_handle (label “Insta id”), joining_date, etc.
- Store user roles in `public.user_roles` (never on `profiles` directly). Use a `has_role` security-definer helper.
- Default temp password for seeded demo accounts: `Welcome@123`; users must change it after login.
- Protected routes go under `src/routes/_authenticated/`. Unauthenticated users redirect to `/login`.
- Add an audit log table (`public.audit_log`) that records role changes, permission changes, and unauthorized access attempts with timestamps, actor_id, target_id, role, path, and JSON details.

4. Landing Page
- Full black background, neon green hero, clear CTA to login/signup.
- Head metadata with unique title/description/OG tags.

5. Login / Signup
- Split-screen cinematic design:
  - Left: animated particle background, glowing HFC logo, daily motivational quote, stat badges.
  - Right: dark warrior-themed form card.
- Login form: email, password, forgot password link, Google OAuth button.
- Signup form: email, password, username, full name, phone, nickname, group assignment (dropdown), trainer assignment (dropdown).
- On first login, show: “Welcome — first login {nickname} {Username}” with username in Title Case.
- Password reset page `/reset-password` checks `type=recovery` hash and calls `updateUser({ password })`.

6. Navigation
- Desktop: left sidebar with icons + labels. Active item has a sliding green underline and 1.2x icon scale.
- Mobile: bottom tab bar with large icons, dark translucent background, green dot under active tab.
- Navbar background: `rgba(0,0,0,0.95)` with bottom border `rgba(139,192,0,0.15)`.
- Routes under `/app`:
  - `/app` — dashboard
  - `/app/codex` — daily habit tracker
  - `/app/progress` — fitness charts + PRs
  - `/app/achievements` — badges
  - `/app/leaderboard` — rankings
  - `/app/kids` — Junior Warriors
  - `/app/about` — tabs: About, Groups, Trainers, Members
  - `/app/profile` — user profile
  - `/app/admin` — admin panel (admin only)
  - `/app/community`, `/app/mentors`, `/app/chat-panel` — additional social/training pages

7. Dashboard (`/app`)
- Admin view: cards showing total members split into Admins, Members/Users, Mentors/Trainers; names shown on hover; new-this-month list; no-show rate (excluding admins/mentors); recent activity.
- Member view: personal stats, quick actions, Codex streak, upcoming events, mentor info.

8. Daily Codex (`/app/codex`)
- Streak card with flame emoji 🔥 scaled by streak tier (1–6 small, 7–14 medium orange glow, 15–29 large strong glow, 30+ massive intense pulse).
- Streak number below flame: 3.5rem green with `streakGlow`.
- Motivational message by tier.
- 8 habit toggles (Movement, Nutrition, Sleep, Hydration, Mindfulness, Learning, Connection, Gratitude). Checked rows turn green.
- Circular progress ring showing X/8.
- When all 8 are checked: show confetti fall animation and “PERFECT DAY” banner.
- Persist entries in `public.codex_entries`.

9. Progress Page (`/app/progress`)
- Rotating daily motivational quote at top.
- Recharts line/bar charts with `#8BC000` data, `isAnimationActive={true}`, 1200ms animation duration.
- Detect new personal records (PRs) and flash a gold “🏆 New PR!” badge with countUp animation.
- Track progress tests: pushups, pullups, run 100m, run 5k, plank, squats.

10. Achievements Page (`/app/achievements`)
- Badge cards: dark background, rounded-3xl, thick colored border.
- Earned badges: green border, glowing pulse on icon.
- Locked badges: grayscale, `#333` border, lock icon overlay.
- On newly earning a badge: `celebrationBounce` + brief confetti.

11. Leaderboard Page (`/app/leaderboard`)
- Top 3 podium above the table:
  - #2 silver block 100px
  - #1 gold block 140px with crown and `floatBounce`
  - #3 bronze block 80px
- Each block shows rank, name, streak score.
- Highlight current user row with a “YOU” badge.
- Show weekly reset countdown.

12. Kids Section (`/app/kids`) — “Junior Warriors”
- Navy starfield background, Nunito font, comic/premium fitness-game feel.
- Header: “Junior Warriors”.
- Warrior levels based on XP/stars.
- 6 habit cards (punctual, exercise, water, sleep, bed, etc.) with progress dots.
- Star burst animations, staggered card entrance.
- Log button, celebration overlay on milestone.
- Persist check-ins and stars in `public.kids_daily` and `public.kids_stars`.

13. About Page (`/app/about`)
Tabs in order: About | Groups | Trainers | Members.

About tab: club description, mission, testimonials.

Groups tab:
- Show groups/brigades.
- Admin/mentor can add/edit/delete groups.
- “Members” and “Trainers” buttons per group.
- Expandable group cards showing assigned trainers and members.

Trainers tab:
- Card view for each trainer: name, code, specialty, groups assigned as chips.
- Admin can add/edit/delete trainers.
- Add/Edit trainer form with multi-select group assignment dropdown.

Members tab:
- Show only users with `user` role (no admins or mentors/trainers).
- Display nickname as a primary-colored pill if assigned.
- Search by name, phone, trainer, group.
- Sort by Name, Phone, Trainer, Group.
- Group and trainer assignment dropdowns:
  - Selecting a group filters the trainer dropdown to trainers assigned to that group.
  - Selecting a trainer shows the trainer’s assigned groups.
- Inline edit/save for nickname, group, trainer.

14. Profile Page (`/app/profile`)
- Account section: read-only email, username (Title Case), Insta id, Mentor (tooltip “Trainer”), Brigade Unit (tooltip “Group”).
- Collapsible “Notification Preferences” section minimized by default; user expands to edit.
- “Current Diet” section with select: Veg / Non-veg / Others. If Others selected, show free-text input.
- Editable fields: full name, phone, birthday, height, weight, activity level, fitness goals, past injuries, medications, allergies, sleep hours, hydration liters, avatar URL.

15. Admin Panel (`/app/admin`)
- Admin-only route.
- Overview tab: role split counts with hover cards listing names; new-this-month list; no-show rate and absent users list (excluding admins/mentors).
- User Monitoring & Analytics tab: per-user activity; hover over login count to show all login timestamps.
- Audit Log tab: filterable table of role/permission changes and unauthorized access attempts with timestamps, actor/target identifiers, roles, paths, and JSON details.

16. Additional Pages
- Mentors / Trainers directory: list mentors with group assignments and contact info.
- Community / Chat: group messaging rooms, real-time chat messages stored in `public.chat_messages`.
- Events & RSVP: create events, RSVP, notifications.
- Gallery: image uploads with categories/groups.
- Challenges: create challenges, track completions, leaderboards.
- Health Logs: calorie logging, health entries, storage uploads.
- Book Log: reading list with status.
- Inventory: equipment/items assignment.
- Notifications: in-app notification list with preferences.
- Feedback: user feedback form.

17. Database & Security Requirements
- Every new `public` table must have GRANTs and RLS enabled in the same migration.
- Use `security invoker` for views exposing profile data.
- Use security-definer triggers only where necessary (e.g., assignment locks, mentor update scope).
- No anonymous sign-ups; email confirmation required unless explicitly configured otherwise.
- Revoke PUBLIC/anon execute on internal trigger functions.
- Remove duplicate storage policies and recreate authoritative ones.
- Server functions must use `createServerFn` from `@tanstack/react-start`; protected fns use `requireSupabaseAuth`.
- Admin client (`supabaseAdmin`) loaded only inside handlers; never in components or loaders.

18. Testing
- Add Vitest with `vitest.config.ts`.
- Test suites covering:
  - Username Title Case formatting.
  - Auth role derivation.
  - Every `/app` route’s role access matrix (admin/mentor/user).
  - Redirects for unauthenticated users.
  - Audit log helpers.
  - Regression checks for previously fixed UI/admin bugs.
- All tests must pass; TypeScript and build must pass; browser console must be error-free.

19. Deployment / Publishing
- Configure for Lovable Cloud / Supabase backend.
- Provide publish step and ensure protected routes remain gated.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or user credentials.

---

Goal: Produce a premium, cinematic dark-theme fitness club app with role-based access, gamified habit tracking, admin analytics, real-time social features, and a consistent neon-green visual language across every screen.
