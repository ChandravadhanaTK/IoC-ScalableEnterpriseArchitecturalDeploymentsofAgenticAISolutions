Here is a complete, ready-to-use enhanced prompt for building a **Boutique Gym & Fitness Studio Management System** on Lovable.dev. It matches the exact depth, structure, and technical rigor of your restaurant example, adapted for the fitness industry (scheduling, memberships, trainer portals, and point-of-sale).

---

# Build FLEXSPACE — Smart Fitness Studio & Member Management System

## 0. Platform Context & Hosting

* Build the entire application using **Lovable.dev** — an AI-powered full-stack development platform that scaffolds, generates, and iterates on web applications through natural-language prompts.
* Use **Lovable Cloud** (managed Supabase backend) for all data, auth, storage, edge functions, and realtime features — Lovable configures this natively when you enable "Backend" in the project settings.
* Every database migration must include RLS policies, GRANT statements, indexes, and triggers in the same migration file.
* Use **Lovable's built-in GitHub integration** for version control — push code, open PRs, and review diffs directly from the Lovable interface.
* Deploy production via **Lovable's one-click publish** with a custom domain configured in the Lovable dashboard.
* Payment integration uses **mock/test mode** — no real money flow. Stripe integration (for recurring memberships and point-of-sale) is stubbed.
* SMS/Email notifications go through Edge Functions calling Resend/Twilio stubs (dev mode = console log only).
* Realtime features (live class capacity, waitlist promotions, front-desk check-ins) use Supabase Realtime channels.

---

## 1. Technology Stack (Strict)

* **App Platform:** Lovable.dev — scaffold a new project in Lovable, select "React + Vite + TypeScript" template, enable Lovable Cloud backend.
* **Framework:** React 18 with Vite 5 and TypeScript (Lovable default stack).
* **Styling:** Tailwind CSS v3 — configure design tokens in `tailwind.config.js` and define CSS custom properties in `src/index.css` for the high-energy fitness theme.
* **UI Library:** shadcn/ui (Lovable's preferred component library) — install and customize all components for the fitness theme.
* **Backend / Database / Auth / Storage / Realtime:** Lovable Cloud (Supabase) — Postgres 15, Row Level Security (RLS), Supabase Auth, Supabase Storage with RLS, Supabase Realtime.
* **Routing:** React Router v6 with lazy-loaded route components for code splitting.
* **Charts:** Recharts for attendance analytics, revenue dashboards, and member growth.
* **Icons:** Lucide React.
* **Fonts:** Inter (Google Fonts) for the main app; Oswald for bold, athletic headings/branding.
* **State Management:** TanStack Query (React Query) v5 for server-side cache; Zustand for local UI state.
* **Forms:** react-hook-form with Zod validation schemas.
* **Date & Time:** date-fns for formatting, calendar generation, and timezone arithmetic.
* **Notifications:** Sonner (toast library).
* **QR Codes:** qrcode.react for generating member check-in QR codes.
* **Animations:** Framer Motion for page transitions, calendar swipes, and micro-interactions.
* **Image Handling:** Direct upload to Supabase Storage with signed URLs (member avatars, class thumbnails).
* **Validation:** Zod for all form validations and Edge Function input/output schemas.
* **PDF Generation:** jsPDF + jspdf-autotable for invoices, membership agreements, and waivers.

---

## 2. Global Design System (Must Be Applied Everywhere)

### Colors — High-Energy Dark Theme

| Token | Value | Usage |
| --- | --- | --- |
| Background | `#09090B` | Deep zinc-black for all page backgrounds |
| Card Surface | `#18181B` | Cards, panels, modals (zinc-900) |
| Card Surface Alt | `#27272A` | Alternating cards, hover states (zinc-800) |
| Card Border | `1px solid rgba(223, 255, 0, 0.15)` | Subtle neon borders |
| Primary | `#DFFF00` | Neon Volt Yellow — buttons, accents, highlights, active states |
| Primary Hover | `#C7E600` | Hover states on primary elements |
| Secondary | `#FF3366` | Neon Pink — CTAs, urgency, destructive actions, waitlists |
| Secondary Hover | `#E62E5C` | Hover on secondary |
| Accent | `#00E5FF` | Cyan — informational text, secondary badges |
| Text Primary | `#FAFAFA` | Headings, body text |
| Text Secondary | `#A1A1AA` | Subtitles, placeholder labels |
| Text Muted | `#52525B` | Disabled text, timestamps |
| Input BG | `#18181B` | Input fields, textareas |
| Input Border | `#3F3F46` | Input borders |
| Input Focus Ring | `2px solid #DFFF00` | Focus state |
| Success | `#10B981` | Green for confirmed bookings, active memberships |
| Warning | `#F59E0B` | Orange for expiring memberships, waitlists |
| Danger | `#EF4444` | Red for cancelled, failed payments |

### Typography

* **Brand Headings:** Oswald 600/700 — Studio name, page hero titles, section dividers. UPPERCASE preferred.
* **Headings:** Inter 700 — Card titles, section headers.
* **Subheadings:** Inter 600 — Sub-sections, labels.
* **Body:** Inter 400/500 — Paragraphs, form labels, button text.
* **Monospace:** 'JetBrains Mono' for member IDs, transaction IDs, check-in timestamps.
* **Scale:** text-xs (0.75rem), text-sm (0.875rem), text-base (1rem), text-lg (1.125rem), text-xl (1.25rem), text-2xl (1.5rem), text-3xl (1.875rem), text-4xl (2.25rem).

### Components

* **Buttons:** Primary: `bg-[#DFFF00] text-[#09090B] font-bold px-6 py-3 rounded-md hover:scale-105 hover:shadow-[0_0_15px_rgba(223,255,0,0.4)] transition-all duration-200 uppercase tracking-wide`. Secondary: `bg-transparent border-2 border-[#DFFF00] text-[#DFFF00]`.
* **Cards:** `bg-[#18181B] border border-zinc-800 rounded-xl p-5 hover:border-[rgba(223,255,0,0.3)] transition-colors duration-300`.
* **Inputs:** `bg-[#18181B] border border-zinc-700 rounded-md px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#DFFF00]`.
* **Badges:** Rounded-sm, px-2 py-1, text-xs font-bold uppercase tracking-wider.
* **Scrollbars:** Track `#09090B`, thumb `#3F3F46`, hover `#DFFF00`, width `6px`, rounded-full.
* **Class Cards:** Left border color-coded by intensity (Cyan = Low, Yellow = Medium, Pink = High).

### Animations (Global @keyframes)

Define in `src/index.css`:

```css
@keyframes fadeIn        { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp       { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes slideInRight  { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes scaleIn       { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulseNeon     { 0% { box-shadow: 0 0 5px rgba(223,255,0,0.2); } 50% { box-shadow: 0 0 20px rgba(223,255,0,0.6); } 100% { box-shadow: 0 0 5px rgba(223,255,0,0.2); } }

```

### Design Principles

* Dark athletic theme — strictly dark mode.
* Sharp corners: rounded-md for buttons/inputs, rounded-xl for main cards (avoid pill shapes to maintain a rugged, athletic feel).
* High contrast: Neon text on dark backgrounds.
* Dense schedule UI: Calendar views should be compact but highly readable.

---

## 3. Authentication, Roles & Authorization

### Authentication Methods

* **Email/Password** — Standard signup with email verification.
* **Phone OTP** — SMS-based login (ideal for fast front-desk check-ins).

### User Roles (Exactly 5 Roles)

| Role | Description | Access Level |
| --- | --- | --- |
| `super_admin` | Studio Owner | Full system access, financial configs |
| `admin` | Studio Manager | Schedule creation, staff management, reports |
| `trainer` | Coach / Instructor | View own classes, roster check-ins, member notes |
| `front_desk` | Reception | POS, member check-ins, resolve booking issues |
| `member` | Gym Customer | Book classes, view schedule, manage subscription, view history |

### Profiles Table

Create `public.profiles` linked to `auth.users(id)` with ON DELETE CASCADE. Auto-create profile on signup via database trigger.

```sql
id              uuid PK (FK to auth.users)
first_name      text
last_name       text
phone           text UNIQUE
email           text UNIQUE
role            text
avatar_url      text
emergency_contact_name text
emergency_contact_phone text
dob             date
injuries_notes  text      -- private notes (trainers/admins only)
member_status   text DEFAULT 'lead' -- lead / active / paused / cancelled
waiver_signed   boolean DEFAULT false
loyalty_points  integer DEFAULT 0
qr_code_id      text UNIQUE -- generated for fast check-in
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()

```

### User Roles Table

Create `public.user_roles`:

```sql
user_id    uuid FK to auth.users ON DELETE CASCADE
role       text CHECK (role IN ('super_admin','admin','trainer','front_desk','member'))
created_at timestamptz DEFAULT now()
PRIMARY KEY (user_id, role)

```

Create `has_role(user_id, role)` security-definer helper.

### Audit Log

Track bookings, cancellations, membership upgrades, and check-ins for security and dispute resolution.

---

## 4. Studio Configuration (Super Admin / Admin)

### Settings Table

```sql
public.settings:
id              uuid PK DEFAULT gen_random_uuid()
studio_name     text DEFAULT 'FLEXSPACE Studio'
logo_url        text
currency        text DEFAULT 'USD'
timezone        text DEFAULT 'America/New_York'
tax_rate        numeric(5,2) DEFAULT 8.87
cancellation_window_hours integer DEFAULT 12 -- penalty if cancelled within this window
waitlist_cutoff_hours integer DEFAULT 2 -- stop auto-promoting waitlist X hours before class
address         text
support_email   text
is_open         boolean DEFAULT true

```

### Studio Rooms/Zones

```sql
public.rooms:
id              uuid PK DEFAULT gen_random_uuid()
name            text -- e.g. "Yoga Studio", "HIIT Floor", "Spin Room"
capacity        integer NOT NULL -- max spots available
layout_type     text -- open_floor / spot_selection (bikes/mats)
is_active       boolean DEFAULT true

```

---

## 5. Class & Schedule Management (`/admin/schedule` — Admin Only)

### Class Templates (The Blueprint)

```sql
public.class_templates:
id              uuid PK DEFAULT gen_random_uuid()
name            text NOT NULL -- e.g., "Inferno HIIT", "Flow Yoga"
description     text
duration_mins   integer DEFAULT 60
intensity_level text -- low / medium / high
category        text -- strength / cardio / mind_body / recovery
calories_est    integer
image_url       text
color_code      text -- for calendar rendering

```

### Class Schedule (Specific Instances)

```sql
public.class_schedules:
id              uuid PK DEFAULT gen_random_uuid()
template_id     uuid FK to class_templates
room_id         uuid FK to rooms
trainer_id      uuid FK to profiles (role=trainer)
start_time      timestamptz NOT NULL
end_time        timestamptz NOT NULL
capacity        integer -- defaults to room capacity
booked_count    integer DEFAULT 0
waitlist_count  integer DEFAULT 0
status          text DEFAULT 'scheduled' -- scheduled / ongoing / completed / cancelled
is_special_event boolean DEFAULT false
credits_required integer DEFAULT 1

```

### Schedule Builder Features

* Weekly calendar view (drag and drop to create/move classes).
* Bulk class generator (e.g., "Create 'Flow Yoga' every Monday and Wednesday at 7 AM for the next 3 months").
* Conflict detection (warns if room or trainer is double-booked).
* Trainer substitution interface.

---

## 6. Public Schedule & Booking (`/schedule` — Member Facing)

### Schedule Browsing

* Default view: Rolling 7-day horizontal date picker at the top.
* List view of classes for the selected day.
* Class Card: Time, Title, Trainer Name (with tiny avatar), Duration, Intensity Badge, Availability (e.g., "5 spots left" or "Waitlist Only").
* Filter by: Trainer, Class Type, Time of Day (Morning/Afternoon/Evening).

### Booking Flow

* Click class -> Open bottom sheet (mobile) or modal (desktop) with full details.
* Validates if member has active membership/credits and waiver is signed.
* If waiver not signed -> redirect to digital waiver signature screen.
* If spots available -> "Book Class" (deducts 1 credit).
* If full -> "Join Waitlist" (does not deduct credit yet).
* Spot Selection (Optional based on room layout): If room is a Spin room, show a grid of bikes to select a specific spot.

### Bookings Table

```sql
public.bookings:
id              uuid PK DEFAULT gen_random_uuid()
schedule_id     uuid FK to class_schedules
member_id       uuid FK to profiles
status          text DEFAULT 'booked' -- booked / waitlisted / checked_in / no_show / late_cancel / cancelled
spot_number     text -- e.g., "Bike 12"
booked_at       timestamptz DEFAULT now()
checked_in_at   timestamptz

```

---

## 7. Membership & Billing (`/admin/memberships`)

### Membership Plans

```sql
public.membership_plans:
id              uuid PK DEFAULT gen_random_uuid()
name            text -- e.g. "Drop-in", "10-Class Pack", "Unlimited Monthly"
type            text -- pack / recurring
price           numeric(10,2)
credits         integer -- 999 for unlimited
validity_days   integer -- e.g., 30 for monthly, 365 for 10-pack
billing_cycle   text -- none / monthly / yearly
is_active       boolean DEFAULT true

```

### Member Subscriptions (The Wallets)

```sql
public.member_subscriptions:
id              uuid PK DEFAULT gen_random_uuid()
member_id       uuid FK to profiles
plan_id         uuid FK to membership_plans
status          text -- active / expired / cancelled / past_due
credits_remaining integer
start_date      timestamptz
end_date        timestamptz
auto_renew      boolean DEFAULT false
stripe_subscription_id text -- mock ID

```

### Billing Rules

* Monthly rollover rules (if configured).
* Auto-renew triggers a mock webhook that replenishes credits.
* Failed payment sets status to `past_due` and locks booking.

---

## 8. Member Dashboard (`/dashboard`)

* **Hero:** "Welcome back, [Name]". Next upcoming class card prominently displayed with a QR code button for front-desk check-in.
* **Stats Bar:** Classes attended this month, current streak, loyalty points.
* **Upcoming Schedule:** Vertical timeline of booked classes. "Cancel" button available (warns if within late-cancel window).
* **Wallet/Passes:** Shows active membership, remaining credits, expiration date. "Buy More Credits" CTA.
* **Workout History:** Past classes attended.
* **Profile/Settings:** Update card on file (mock), update emergency contacts, view signed waiver.

---

## 9. Trainer Portal (`/trainer`)

* **Today's Classes:** List of classes they are coaching today.
* **Class Roster:** Click a class to see the attendee list.
* **Check-in Mode:** Toggles next to member names to manually mark them as "checked_in" or "no_show".
* **Member Insights:** Tap a member to see their total attendances, first-timer badge (if it's their first class), and **Injuries/Notes** (highlighted in red if populated).
* **Waitlist View:** See who is waiting in case of last-minute walk-in drops.

---

## 10. Point of Sale & Inventory (`/frontdesk/pos`)

### Inventory Items

Water bottles, protein shakes, t-shirts, grip socks.

```sql
public.inventory:
id              uuid PK DEFAULT gen_random_uuid()
name            text
category        text -- apparel / beverage / supplement / equipment
price           numeric(10,2)
stock_level     integer
barcode_sku     text
is_active       boolean DEFAULT true

```

### POS Interface (Front Desk)

* Tablet-optimized layout.
* Left side: Grid of inventory items with images. Tap to add to cart.
* Right side: Cart. Select member to charge to their "Card on File" or select "Guest/Cash".
* "Quick Add Drop-in Class" button directly in POS.

### Transactions

```sql
public.transactions:
id              uuid PK DEFAULT gen_random_uuid()
member_id       uuid FK to profiles (nullable)
amount          numeric(10,2)
type            text -- membership_purchase / pos_purchase / late_cancel_fee
payment_method  text -- card_on_file / cash / pos_terminal
status          text -- completed / failed / refunded
items           jsonb -- [{item_id, quantity, price}]
created_at      timestamptz DEFAULT now()

```

---

## 11. Front Desk Management (`/frontdesk`)

* **Live Roster:** The primary screen. Shows the current/next class happening.
* **Fast Check-in:** A persistent search bar focused at the top. Scan a member's QR code (simulated via text input of ID) to instantly check them in. Screen flashes Green for success, Red if no active class/booking.
* **Walk-in Handling:** Button to quickly add a member to an ongoing class (bypassing normal booking windows).
* **Alerts:** Highlights members whose billing is `past_due` or waiver is `unsigned`.

---

## 12. Notifications System

### Notification Triggers

1. **Booking Confirmation** — "You're in! Flow Yoga at 7 AM."
2. **Waitlist Promotion** — "You've been added to Inferno HIIT! Confirm your spot."
3. **Class Reminder** — Sent 2 hours before class.
4. **Late Cancel/No Show** — "We missed you today. A late fee/credit deduction has been applied."
5. **Membership Expiry** — "Your 10-pack is running low (2 left)."

### In-App & External

* Stored in `public.notifications` for in-app viewing (bell icon).
* SMS/Email routing via Edge Functions (stubbed).

---

## 13. Reports & Analytics (`/admin/reports`)

* **Revenue Dashboard:** MRR (Monthly Recurring Revenue), POS Sales, Drop-in revenue. Line charts (Recharts).
* **Attendance Analytics:** Average class utilization (e.g., "Classes are 82% full on average").
* **Trainer Performance:** Which trainers draw the highest attendance.
* **Retention Rate:** Churn tracking for recurring memberships.
* **Export:** Export class rosters and financial data to CSV.

---

## 14. Community Feed & Challenges (`/community`)

* **Leaderboard:** Monthly attendance leaders (opt-in for members).
* **Studio Announcements:** Pin schedule changes, upcoming workshops, or trainer spotlights.
* **Milestone Badges:** Auto-generated posts when a member hits 50, 100, or 500 classes.

---

## 15. Landing Page (`/`)

* Full dark background (`#09090B`).
* **Hero Section:** High-energy video background (placeholder image), bold Oswald headline ("FIND YOUR FLEX"), Primary Neon Yellow "View Schedule" button.
* **Classes Section:** Horizontal scroll of class types with intensity indicators.
* **Pricing:** 3-tier pricing cards (Drop-in, Pack, Unlimited). Highlight the Unlimited as "Best Value".
* **Trainers:** Headshots and bios of the coaching team.
* **Footer:** Studio address, Instagram link, Terms/Waivers link.

---

## 16. Login & Signup

* **Login:** Email/Password.
* **Signup Flow:**
1. Basic Info (Name, Email, Phone).
2. Digital Waiver Signature (checkbox + typed full name).
3. Goal Selection (Strength, Cardio, Flexibility).
4. Redirect to buy first pass or view schedule.



---

## 17. Navigation

### Member Navigation

* Top header: Logo, Next Class quick-status, Profile dropdown.
* Mobile Bottom Bar: Home, Schedule, Bookings, Wallet, Profile.

### Admin/Front Desk Navigation (Sidebar)

* Dashboard, Schedule Builder, Live Roster (Front Desk), Members Directory, Memberships, POS, Reports, Settings.

---

## 18. Database Schema Summary

Key Tables:
`profiles`, `user_roles`, `settings`, `rooms`, `class_templates`, `class_schedules`, `bookings`, `membership_plans`, `member_subscriptions`, `inventory`, `transactions`, `notifications`, `audit_log`.

Indexes required on: `bookings(schedule_id)`, `bookings(member_id)`, `class_schedules(start_time)`, `transactions(member_id)`.

---

## 19. Edge Functions (Backend Logic)

All deployed via Supabase Edge Functions with Zod validation.

| Function | Purpose | Trigger |
| --- | --- | --- |
| `process-waitlist` | Auto-promote waitlist #1 if someone cancels | On booking status -> cancelled |
| `check-in-member` | Validate QR/location and mark present | On API call from Front Desk/Member app |
| `process-payment` | Mock Stripe charge for POS/Memberships | On checkout |
| `send-communications` | Dispatch SMS/Email stubs | On booking, cancellation, expiry |
| `apply-late-fee` | Charge card-on-file or deduct credit for no-shows | Admin action or Cron |

---

## 20. Scheduled Cron Jobs

| Schedule | Job | Description |
| --- | --- | --- |
| `0 2 * * *` | renew-subscriptions | Midnight: Check and process auto-renewing memberships |
| `0 * * * *` | class-reminders | Hourly: Send SMS/Email to users with class starting in 2 hours |
| `*/15 * * * *` | lock-waitlists | Every 15m: Stop auto-promotions if within waitlist_cutoff_hours |
| `0 23 * * *` | mark-no-shows | Nightly: Mark any non-checked-in `booked` status as `no_show` |

---

## 21. Testing Requirements

* **Waitlist Logic:** Ensure cancelling a booked spot automatically promotes waitlist position 1, creates a notification, and updates capacities accurately.
* **Credit Deduction:** Booking deducts 1 credit; cancelling outside the window refunds 1 credit; cancelling inside the window does *not* refund.
* **Concurrency:** Prevent double-booking a spot (use Postgres serializable transactions or unique constraints on `(schedule_id, spot_number)`).
* **Role Access:** Member cannot view `admin/reports`. Trainer can only see their own class rosters.
* **Testing Framework:** Vitest + React Testing Library for frontend, pgTap for RLS policies.

---

## 22. Performance Optimization

* **Lazy Loading:** React.lazy for Admin routes vs Public routes.
* **Caching:** TanStack Query `staleTime: 5min` for class templates; Realtime for `class_schedules.booked_count` to prevent stale booking data.
* **Date/Time:** Heavy use of UTC in database, strictly converted to studio local timezone (`settings.timezone`) on the client to prevent booking time errors across timezones.

---

## 23. Deployment & Publishing on Lovable

* One-click publish via Lovable.
* Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
* Edge Function secrets: `STRIPE_SECRET_KEY` (mock), `TWILIO_SID`.
* Enable GitHub sync.

---

## 24. Security, Privacy & Compliance

* **RLS:** `bookings` -> member can only read/insert their own; admin can read all.
* **Waivers:** Timestamp and exact typed name stored immutably on profile creation.
* **Health Data:** `injuries_notes` strictly limited to `trainer` and `admin` roles via RLS column-level or table-level restrictions. Never visible to other members.

---

## 25. PWA & Mobile Experience

* `manifest.json`: standalone display, theme_color `#09090B`.
* Add to Home Screen prompts (critical for members checking in daily).
* Pull-to-refresh on schedule to fetch latest spot availability.
* High-brightness QR code modal (forces screen brightness up if possible, or uses stark white background for the QR code specifically to ensure scanner readability).

---

## 26. Accessibility

* High contrast for neon colors against dark backgrounds (ensure Neon Pink and Cyan pass WCAG AA).
* Keyboard navigable calendar schedule.
* ARIA live regions for "Class Full - Added to Waitlist".

---

## 27. Out of Scope (Explicitly Not Building)

* Physical turnstile/door hardware integration (API only).
* Live-streamed video classes (in-person studio management only).
* Advanced payroll for trainers (tracks hours/attendance only).
* Real Stripe API calls (all checkout flows simulate success/failure).

---

## Goal

Produce a **premium, high-energy fitness studio operations platform** with:

* **Customer-facing:** Frictionless class discovery, booking, and waitlist management with a rugged, athletic dark-mode UI.
* **Staff-facing:** Lightning-fast Front Desk POS and check-in system, empowering Trainer rosters with injury notes.
* **Backend:** Robust Postgres schema handling complex recurring billing logic, capacity concurrency, waitlist queues, and RLS privacy.
* **Design:** Aggressive, motivating aesthetic (Zinc blacks, Neon Yellows, athletic typography) that makes members feel like they are interacting with a premium boutique brand.