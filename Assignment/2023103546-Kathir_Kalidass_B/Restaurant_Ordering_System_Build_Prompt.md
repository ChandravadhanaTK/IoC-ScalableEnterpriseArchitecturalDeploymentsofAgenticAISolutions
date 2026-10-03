Here is a complete, ready-to-use enhanced prompt for building a Restaurant Ordering & Table Management System on Lovable.dev — "CHEFSTATION — Smart Restaurant Operations Hub":

---

# Build CHEFSTATION — Restaurant Ordering & Table Management System

## 0. Platform Context & Hosting
- Build the entire application using **Lovable.dev** — an AI-powered full-stack development platform that scaffolds, generates, and iterates on web applications through natural-language prompts.
- Use **Lovable Cloud** (managed Supabase backend) for all data, auth, storage, edge functions, and realtime features — Lovable configures this natively when you enable "Backend" in the project settings.
- Every database migration must include RLS policies, GRANT statements, indexes, and triggers in the same migration file.
- Use **Lovable's built-in GitHub integration** for version control — push code, open PRs, and review diffs directly from the Lovable interface.
- Deploy production via **Lovable's one-click publish** with a custom domain configured in the Lovable dashboard.
- Payment integration uses **mock/test mode** — no real money flow. Stripe integration is stubbed.
- SMS/Email notifications go through Edge Functions calling Resend/Twilio stubs (dev mode = console log only).
- Realtime features (KDS order updates, table status) use Supabase Realtime channels.

---

## 1. Technology Stack (Strict)
- **App Platform:** Lovable.dev — scaffold a new project in Lovable, select "React + Vite + TypeScript" template, enable Lovable Cloud backend.
- **Framework:** React 18 with Vite 5 and TypeScript (Lovable default stack).
- **Styling:** Tailwind CSS v3 — configure design tokens in `tailwind.config.js` and define CSS custom properties in `src/index.css` for the warm restaurant theme.
- **UI Library:** shadcn/ui (Lovable's preferred component library) — install and customize all components for the restaurant theme.
- **Backend / Database / Auth / Storage / Realtime:** Lovable Cloud (Supabase) — Postgres 15, Row Level Security (RLS), Supabase Auth, Supabase Storage with RLS, Supabase Realtime.
- **Routing:** React Router v6 with lazy-loaded route components for code splitting.
- **Charts:** Recharts for analytics dashboards, sales reports, demand forecasts.
- **Icons:** Lucide React.
- **Fonts:** Inter (Google Fonts) for the main app; Playfair Display for headings/branding.
- **State Management:** TanStack Query (React Query) v5 for server-side cache; Zustand for local UI state.
- **Forms:** react-hook-form with Zod validation schemas.
- **Date & Time:** date-fns for formatting and date arithmetic.
- **Notifications:** Sonner (toast library).
- **QR Codes:** qrcode.react for generating QR codes for tables.
- **Animations:** Framer Motion for page transitions and micro-interactions.
- **Image Handling:** Direct upload to Supabase Storage with signed URLs.
- **Validation:** Zod for all form validations and Edge Function input/output schemas.
- **PDF Generation:** jsPDF + jspdf-autotable for invoices, reports, receipts.

---

## 2. Global Design System (Must Be Applied Everywhere)

### Colors — Warm Restaurant Theme
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0F0A07` | Deep warm black-brown for all page backgrounds |
| Card Surface | `#1A1410` | Cards, panels, modals |
| Card Surface Alt | `#15100B` | Alternating cards |
| Card Border | `1px solid rgba(212, 160, 23, 0.12)` | All card borders |
| Primary | `#D4A017` | Gold — buttons, accents, highlights, active states |
| Primary Hover | `#E8B830` | Hover states on primary elements |
| Secondary | `#8B0000` | Deep red — CTAs, urgency, important actions |
| Secondary Hover | `#A50000` | Hover on secondary |
| Accent | `#F5E6D3` | Cream — text on dark backgrounds, light accents |
| Text Primary | `#FFFFFF` | Headings, body text |
| Text Secondary | `#9E9E9E` | Subtitles, placeholder labels |
| Text Muted | `#666666` | Disabled text, timestamps |
| Input BG | `#1E1814` | Input fields, textareas |
| Input Border | `#2E2620` | Input borders |
| Input Focus Ring | `3px solid #D4A017` | Focus state |
| Success | `#2E7D32` | Green for confirmed, completed |
| Warning | `#F57C00` | Orange for pending, attention needed |
| Danger | `#D32F2F` | Red for cancelled, errors, refunds |
| Info | `#1976D2` | Blue for informational badges |
| Overlay | `rgba(0,0,0,0.85)` | Modals, drawers, backdrops |

### Typography
- **Brand Headings:** Playfair Display 700/900 — Restaurant name, page hero titles, section dividers.
- **Headings:** Inter 700 — Card titles, section headers.
- **Subheadings:** Inter 600 — Sub-sections, labels.
- **Body:** Inter 400/500 — Paragraphs, form labels, button text.
- **Monospace:** 'JetBrains Mono' for order numbers, table IDs, timestamps, KDS.
- **Scale:** text-xs (0.75rem), text-sm (0.875rem), text-base (1rem), text-lg (1.125rem), text-xl (1.25rem), text-2xl (1.5rem), text-3xl (1.875rem), text-4xl (2.25rem), text-5xl (3rem).

### Components
- **Buttons:** Primary: `bg-[#D4A017] text-[#0F0A07] font-bold px-6 py-3 rounded-xl hover:scale-105 hover:shadow-[0_0_20px_rgba(212,160,23,0.3)] transition-all duration-200`. Secondary: `bg-[#8B0000] text-white`. Ghost: transparent, gold border, gold text on hover.
- **Cards:** `bg-[#1A1410] border border-[rgba(212,160,23,0.12)] rounded-2xl p-5 hover:shadow-[0_4px_20px_rgba(212,160,23,0.06)] transition-all duration-300`.
- **Inputs:** `bg-[#1E1814] border border-[#2E2620] rounded-xl px-4 py-3 text-white placeholder:text-[#666] focus:outline-none focus:ring-3 focus:ring-[#D4A017]`.
- **Badges:** Rounded-full, px-3 py-1, text-xs font-semibold. Color-coded by status (green=confirmed, orange=preparing, blue=served, red=cancelled).
- **Scrollbars:** Track `#0F0A07`, thumb `#D4A017`, width `5px`, rounded-full.
- **Order Cards:** Left border color-coded by status (green=confirmed, orange=preparing, blue=served, red=cancelled).
- **KDS Cards:** Large monospace order number, timer counting up, color-coded priority border (red=urgent >20min, orange=warning >15min, green=normal).

### Animations (Global @keyframes)
Define in `src/index.css`:
```
@keyframes fadeIn        — opacity 0→1, 300ms ease-out
@keyframes slideUp       — translateY(20px) opacity 0 → 0, 1, 400ms ease-out
@keyframes slideInRight  — translateX(30px) opacity 0 → 0, 1, 300ms ease-out
@keyframes scaleIn       — scale(0.9) opacity 0 → 1, 1, 250ms ease-out
@keyframes glowPulse     — opacity 1→0.5→1, 2000ms infinite
@keyframes countUp       — opacity 0 translateY(10px) → 1, 0, 500ms ease-out
@keyframes shimmer       — background-position shift, 2000ms linear infinite
@keyframes slideInLeft   — translateX(-100%) → 0, 300ms ease-out
@keyframes bounceIn      — scale(0.3) opacity 0 → 1.05 → 1, 500ms ease-out
@keyframes pulse-ring    — scale(1) opacity 1 → scale(1.5) opacity 0, 1000ms infinite
@keyframes orderSlide    — translateX(100%) → 0, 400ms ease-out (new KDS order)
@keyframes timerWarning  — opacity 1→0.3→1, 500ms infinite (urgent timer)
```

### Design Principles
- Dark warm theme — no light mode.
- Generous spacing: p-5, gap-5 for cards; p-4, gap-3 for compact layouts.
- Border radius: rounded-xl for inputs/buttons, rounded-2xl for cards.
- Transitions: 200ms ease-out for hover, 300ms for page transitions.
- Order numbers displayed prominently in monospace font (e.g., #ORD-0042).
- Status badges always visible — never hide order status.
- KDS interface: large text, high contrast, color-coded urgency, minimal UI chrome.

---

## 3. Authentication, Roles & Authorization

### Authentication Methods
- **Email/Password** — Standard signup with email verification (Supabase Auth).
- **Phone OTP** — SMS-based one-time password login.
- **Magic Link** — Email-based passwordless login.
- Google OAuth (optional, for customer-facing app).

### User Roles (Exactly 5 Roles)
| Role | Description | Access Level |
|------|-------------|-------------|
| `super_admin` | Platform owner | Full system access, all configs |
| `admin` | Restaurant manager | Staff management, menu config, reports, settings |
| `kitchen_staff` | Kitchen/KDS users | Kitchen Display System, order status updates |
| `waiter` | Floor staff | Table management, order taking, order status |
| `customer` | Dine-in / delivery customers | Browse menu, place orders, make reservations, view order history |

### Profiles Table
Create `public.profiles` linked to `auth.users(id)` with ON DELETE CASCADE. Auto-create profile on signup via database trigger.

**Profile columns:**
```
id              uuid PK (FK to auth.users)
username        text UNIQUE              — display name (title-case)
full_name       text                      — legal full name
phone           text                      — E.164 format
email           text                      — cached from auth
role            text                      — cached role
avatar_url      text                      — Supabase Storage path
address         text                      — delivery address (for customers)
dietary_prefs   text[]                    — e.g. ["vegetarian", "gluten-free", "nut-allergy"]
allergies       text[]                    — e.g. ["peanuts", "dairy"]
favorite_items  uuid[]                    — FK to menu_items.id
loyalty_points  integer DEFAULT 0         — reward points
loyalty_tier    text DEFAULT 'bronze'     — bronze/silver/gold/platinum
total_orders    integer DEFAULT 0
total_spent     numeric(10,2) DEFAULT 0
referral_code   text UNIQUE               — generated on signup
referred_by     uuid                      — FK to profiles.id
is_active       boolean DEFAULT true      — soft-active flag
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
deleted_at      timestamptz               — soft delete
```

### User Roles Table
Create `public.user_roles` — never store roles on `profiles` directly:
```
user_id    uuid FK to auth.users ON DELETE CASCADE
role       text CHECK (role IN ('super_admin','admin','kitchen_staff','waiter','customer'))
created_at timestamptz DEFAULT now()
PRIMARY KEY (user_id, role)
```

Create `has_role(user_id, role)` security-definer helper. Use in all RLS policies.

### Authorization Rules
- **super_admin:** Full CRUD on all tables, system config, impersonation.
- **admin:** CRUD on menu, categories, tables, reservations, staff view, reports, settings.
- **kitchen_staff:** Read orders assigned to kitchen, update order status (preparing → ready). Read inventory alerts.
- **waiter:** Read/write orders for assigned tables, update order status, manage reservations, read menu.
- **customer:** Read menu, create orders, create reservations, read own orders/reviews, update own profile.

### Protected Routes
- All routes except `/login`, `/signup`, `/menu` (public menu browsing) require authentication.
- Kitchen routes (`/kds`, `/kitchen`) additionally require `kitchen_staff` role.
- Admin routes (`/admin`, `/staff`) require `admin` or `super_admin`.
- Redirect unauthorized users with "Access Denied" toast.

### Audit Log
```
id              uuid PK
actor_id        uuid FK to auth.users
actor_role      text
target_type     text — user / order / menu_item / table / reservation
target_id       uuid
action          text — create / update / delete / status_change / role_change / access_denied
path            text — route path
details         jsonb — full context
created_at      timestamptz DEFAULT now()
```

---

## 4. Restaurant Configuration (Super Admin / Admin)

### Restaurant Settings Table
```
public.settings:
id              uuid PK DEFAULT gen_random_uuid()
restaurant_name text DEFAULT 'CHEFSTATION Restaurant'
restaurant_logo text — Supabase Storage URL
currency        text DEFAULT 'INR' — ISO currency code
currency_symbol text DEFAULT '₹'
timezone         text DEFAULT 'Asia/Kolkata'
tax_rate         numeric(5,2) DEFAULT 5.00 — percentage
service_charge   numeric(5,2) DEFAULT 0.00 — percentage
gst_number       text
address          text
phone            text
email            text
opening_time     time DEFAULT '11:00:00'
closing_time     time DEFAULT '23:00:00'
order_ready_time integer DEFAULT 15 — expected minutes for order prep
reservation_duration integer DEFAULT 90 — minutes per slot
is_open          boolean DEFAULT true — manual override
updated_by       uuid FK to profiles
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
```

### Operating Hours & Special Days
```
public.operating_hours:
id              uuid PK DEFAULT gen_random_uuid()
day_of_week     integer CHECK (day_of_week BETWEEN 0 AND 6) — 0=Monday
open_time       time
close_time      time
is_closed       boolean DEFAULT false
created_at      timestamptz DEFAULT now()

public.special_days:
id              uuid PK DEFAULT gen_random_uuid()
date            date UNIQUE
name            text — e.g. "Christmas", "New Year's Eve"
is_closed       boolean DEFAULT false
open_time       time (nullable)
close_time      time (nullable)
special_menu_id uuid FK to menus (nullable)
created_at      timestamptz DEFAULT now()
```

---

## 5. Menu Management (`/admin/menu` — Admin Only)

### Categories
```
public.categories:
id              uuid PK DEFAULT gen_random_uuid()
name            text NOT NULL — e.g. "Starters", "Mains", "Beverages"
description     text
image_url       text — Supabase Storage
sort_order      integer DEFAULT 0
is_active       boolean DEFAULT true
is_visible      boolean DEFAULT true — show/hide on customer menu
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```
- CRUD operations with drag-and-drop reorder (sort_order).
- Categories can be toggled visible/hidden per service type (dine-in vs delivery).

### Menu Items
```
public.menu_items:
id                    uuid PK DEFAULT gen_random_uuid()
category_id           uuid FK to categories
name                  text NOT NULL
description           text
price                 numeric(10,2) NOT NULL
original_price        numeric(10,2) — for showing discounts
image_url             text — Supabase Storage
images                text[] — multiple images for gallery
dietary_tags          text[] — vegetarian / vegan / gluten-free / spicy / Jain / dairy-free
allergen_info         text[] — contains nuts / contains dairy / contains gluten
calories              integer — per serving
preparation_time      integer — minutes
is_available          boolean DEFAULT true
is_bestseller         boolean DEFAULT false
is_featured           boolean DEFAULT false
spice_level           integer DEFAULT 0 — 0=none, 1=mild, 2=medium, 3=hot, 4=extra-hot
customization_groups  jsonb — structured customization options (see below)
sort_order            integer DEFAULT 0
serving_size          text — e.g. "1 piece", "250ml", "full"
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
deleted_at            timestamptz
```

**Customization Groups (jsonb structure):**
```json
[
  {
    "groupName": "Bread",
    "required": true,
    "multiSelect": false,
    "options": [
      { "name": "Garlic Bread", "priceModifier": 20 },
      { "name": "Naan", "priceModifier": 15 },
      { "name": "Roti", "priceModifier": 10 }
    ]
  },
  {
    "groupName": "Spice Level",
    "required": false,
    "multiSelect": false,
    "options": [
      { "name": "Mild", "priceModifier": 0 },
      { "name": "Medium", "priceModifier": 0 },
      { "name": "Hot", "priceModifier": 0 }
    ]
  }
]
```

### Combo Meals / Meal Deals
```
public.combo_meals:
id              uuid PK DEFAULT gen_random_uuid()
name            text — e.g. "Lunch Thali Combo"
description     text
image_url       text
items           jsonb — array of {menu_item_id, quantity}
combo_price     numeric(10,2)
is_available    boolean DEFAULT true
valid_from      date
valid_until     date
sort_order      integer DEFAULT 0
created_at      timestamptz DEFAULT now()
```

### Menu Features
- Toggle availability per item (sold out / back in stock) — instantly reflects on customer menu.
- Best-seller badge auto-calculated (top 10 by order count in last 30 days).
- Featured items section (admin-pinned).
- Price history tracking in `public.price_history` for analytics.
- Bulk import menu items via CSV (Edge Function parsing).
- Multi-image gallery per item (up to 5 images).

---

## 6. Public Menu & Ordering (`/menu` — Customer Facing)

### Menu Browsing
- Public route (no login required to browse menu).
- Categories as horizontal scrollable tabs at top (Sticky).
- Category section: header with name + item count, horizontal scroll of item cards.
- Item card: image (rounded-xl), name, short description, price, dietary tags as small chips (green=veg, red=non-veg, yellow=vegan, blue=gluten-free), spice level indicator (chili icons), "Add" button.
- Search bar: real-time search by name/description (debounced 200ms). Highlight matching text.
- Filter chips: Veg Only, Under ₹200, Spicy, Bestseller, Available Now.
- Dietary filter: show only items matching selected dietary preference.

### Item Detail Modal
- Full image gallery (swipeable carousel).
- Description, price, calories, serving size.
- Dietary tags + allergen warnings in red text.
- Spice level indicator.
- Customization groups rendered as radio buttons / checkboxes with price modifiers.
- Quantity selector (- / number / +).
- "Add to Cart" button — green with total price calculated (base + modifiers).

### Cart (Slide-out Panel)
- Right-side drawer (400px wide desktop, full-screen mobile).
- Cart items with image thumbnail, name, customization summary, unit price, quantity controls, line total.
- Subtotal, tax (calculated from settings.tax_rate), service charge, grand total.
- "Proceed to Checkout" button.

### Checkout Flow (Multi-Step)
**Step 1 — Service Type:**
- Dine In / Takeaway / Delivery toggle cards.

**Step 2 — Details:**
- **Dine In:** Table number selector (shows available tables with status), number of guests.
- **Takeaway:** Customer name, phone, pickup time selector (15-min slots from now, within operating hours).
- **Delivery:** Address (auto-fill if logged in), delivery instructions, estimated delivery time.

**Step 3 — Order Summary:**
- Full item list with prices, tax breakdown, total.
- Special instructions textarea (e.g. "Less spicy please").
- Loyalty points redemption toggle (if available).

**Step 4 — Payment (Mock):**
- Payment method: Cash / Card / UPI / Wallet.
- Card form (mock): card number, expiry, CVV (validation only, no real processing).
- UPI: shows UPI ID + QR code for payment.
- "Place Order" button → creates order, redirects to order tracking.

### Order Confirmation
- Order number (large monospace: #ORD-0042).
- Estimated time (preparation_time from settings + queue depth).
- Items summary.
- Payment method.
- "Track Order" button + "Back to Menu" button.
- Option to save order as favorite for quick reorder.

### Dietary Preference Filter
- Persistent toggle in header: "Dietary Preference" dropdown.
- Options: No Filter / Vegetarian Only / Vegan Only / Gluten-Free / Jain / Nut-Free / Dairy-Free.
- Filter applies across entire menu with smooth scroll to filtered items.
- Selected preference saved in localStorage.

---

## 7. Order Management & Tracking (Customer)

### My Orders (`/orders`)
- List of past orders with status timeline.
- Active order: prominent card with real-time status updates via Supabase Realtime.
- Status timeline: Placed → Confirmed → Preparing → Ready → Served / Picked Up / Delivered.
- Each step shows timestamp and optional note (e.g. "Chef says: extra spicy as requested!").
- Reorder button on past orders.
- Cancel button (only while status = "Placed" or "Confirmed").
- Rate & Review button appears after order is "Served" / "Delivered" / "Picked Up".

### Order Tracking Page
- Large order number + status badge (color-coded).
- Real-time progress indicator (animated bar).
- Estimated time remaining with countdown.
- Items list with quantities and prices.
- Delivery tracking (mock map placeholder with ETA).
- "Help" button (opens support chat stub).

---

## 8. Table Management (`/admin/tables` — Admin/Waiter)

### Restaurant Layout
- Visual floor plan: drag-and-drop table arrangement on a canvas.
- Table shapes: Round (2/4/6 seater), Rectangle (4/6/8 seater), Private Booth (4/6 seater), Bar Counter (individual seats).
- Color-coded by status: Available (green), Occupied (red), Reserved (yellow), Cleaning (gray).

### Tables Table
```
public.tables:
id              uuid PK DEFAULT gen_random_uuid()
table_number    text NOT NULL UNIQUE — e.g. "T1", "T2", "A3", "B1"
name            text — display name
capacity        integer NOT NULL — max seats
shape           text — round / rectangle / booth / bar
section         text — indoor / outdoor / balcony / bar
x_position      integer — for floor plan canvas
y_position      integer — for floor plan canvas
status          text DEFAULT 'available' — available / occupied / reserved / cleaning
current_order_id uuid FK to orders (nullable)
assigned_waiter_id uuid FK to profiles (nullable)
qr_code_url     text — Supabase Storage QR image
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Table Actions
- Click table → detail panel: current order, assigned waiter, reservation history, order history for table.
- Status change: Available → Reserved → Occupied → Cleaning → Available.
- Assign waiter to table.
- View current order (if any) — inline order summary.
- Merge tables (for large parties).
- Split bill (for shared tables).

### QR Code System
- Each table has a unique QR code generated via `qrcode.react`.
- QR encodes URL: `{app_url}/menu?table={table_number}`.
- Customer scans → opens menu pre-configured for that table.
- "Scan to Order" stickers printed with table QR + instructions.
- Auto-assigns orders to correct table.

### Table Turnover Optimization
- Track: order_placed_at, order_completed_at, table_freed_at.
- Calculate average turnover time per table/section.
- Dashboard shows: tables approaching expected turnover, tables running over.
- Alert: "Table T5 has been occupied for 95 minutes — average turnover is 60 min."

---

## 9. Reservations (`/admin/reservations` — Admin/Waiter, `/reserve` — Customer)

### Reservations Table
```
public.reservations:
id                    uuid PK DEFAULT gen_random_uuid()
customer_id           uuid FK to profiles (nullable — walk-in has no account)
customer_name         text — for walk-ins
customer_phone        text
customer_email        text
table_id              uuid FK to tables (nullable — assigned on confirmation)
party_size            integer NOT NULL
reservation_date      date NOT NULL
reservation_time      time NOT NULL
duration_minutes      integer DEFAULT 90
status                text DEFAULT 'pending' — pending / confirmed / seated / completed / cancelled / no_show
special_requests      text — e.g. "Birthday celebration, window seat"
dietary_notes         text
occasion             text — birthday / anniversary / business / casual
confirmed_by          uuid FK to profiles (nullable — staff who confirmed)
confirmed_at          timestamptz
seated_at             timestamptz
completed_at          timestamptz
cancelled_at          timestamptz
cancellation_reason   text
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

### Customer Reservation Flow
- Date picker (calendar), Time slot dropdown (15-min slots within operating hours).
- Party size selector (1–20).
- Table preference (indoor/outdoor/balcony/bar/no preference).
- Special requests textarea.
- Customer details (auto-fill if logged in).
- "Confirm Reservation" → sends confirmation notification.

### Admin Reservation Management
- Calendar view (day/week) with reservation blocks color-coded by status.
- Table assignment drag-and-drop.
- Confirm / Seat / Complete / Cancel / Mark No-Show actions.
- Walk-in registration: create reservation on-the-fly, assign table immediately.
- No-show detection: reservations past time + 15 min grace period → auto-flagged.
- Waitlist: when fully booked, add to waitlist with notification on cancellation.
- Reservation statistics: no-show rate, peak hours, average party size.

### Notifications
- Reservation confirmation (SMS/Email to customer).
- 1-hour reminder (SMS/Email to customer).
- Day-of reminder (morning of reservation).
- Staff notification for new reservations on their section.

---

## 10. Kitchen Display System (KDS) (`/kds` — Kitchen Staff Only)

### KDS Layout
- Full-screen dark interface optimized for kitchen monitors (large text, high contrast, minimal chrome).
- Left sidebar: category filters (All, Orders, Prepping, Ready), order count badges per category.
- Main area: Kanban-style columns or card list sorted by priority.

### Order Cards (KDS View)
- Large monospace order number (e.g. #ORD-0042).
- Table number / Takeaway name / Delivery address.
- Time since order placed (large, color-coded timer).
- Customer name, order type, special instructions highlighted.
- Item list: name, quantity, customizations (bolded), modifiers, dietary tags.
- Spice level indicators (chili count).
- Priority indicator: red border if >20 min, orange if >15 min, green if normal.
- Bump button (green, large) → marks order as "Ready".
- Recall button (if accidentally bumped).
- Item-level completion checkboxes (for complex orders).

### Order Priority Logic
- Priority score = (wait_time_minutes * 2) + (party_size * 3) + (delivery_orders * 5).
- Sorted by priority descending — oldest/most urgent orders appear first.
- Delivery orders always prioritized above dine-in.

### Realtime Updates
- New order card slides in from right with `orderSlide` animation.
- Sound notification (optional toggle) — chime for new orders.
- Order status changes reflected instantly via Supabase Realtime.
- Waiter cancels order → card turns red, slides out with animation.

### Kitchen Summary Bar (Top)
- Active orders count, average wait time, orders ready for pickup.
- Current time display (large, always visible).
- Restaurant name + "KDS" label.

### KDS Features
- Item modifiers displayed prominently (large text).
- Course grouping: Starters → Mains → Desserts (if configured).
- Hold/Bump timer for each item.
- Notes from waiter/customer highlighted in yellow box.
- Dietary alerts: red border + icon for Jain/Vegan/Gluten-free items.
- Print receipt button (triggers browser print with kitchen-friendly format).
- Order history archive (past 24 hours) for reference.

---

## 11. Order Management (Admin / Waiter)

### Orders Table
```
public.orders:
id                  uuid PK DEFAULT gen_random_uuid()
order_number        text UNIQUE NOT NULL — e.g. "ORD-0042" (generated sequentially)
customer_id         uuid FK to profiles (nullable for guest orders)
customer_name       text
customer_phone      text
table_id            uuid FK to tables (nullable for delivery/takeaway)
waiter_id           uuid FK to profiles (nullable)
order_type          text — dine_in / takeaway / delivery
status              text DEFAULT 'pending' — pending / confirmed / preparing / ready / served / completed / cancelled / refunded
items               jsonb — full order snapshot (see below)
subtotal            numeric(10,2)
tax_amount          numeric(10,2)
service_charge      numeric(10,2)
discount_amount     numeric(10,2)
discount_code       text FK to discount_codes (nullable)
total_amount        numeric(10,2)
payment_method      text — cash / card / upi / wallet / pending
payment_status      text DEFAULT 'pending' — pending / paid / failed / refunded
special_instructions text
loyalty_points_used integer DEFAULT 0
loyalty_points_earned integer DEFAULT 0
estimated_ready_at  timestamptz
ready_at            timestamptz
served_at           timestamptz
completed_at        timestamptz
cancelled_at        timestamptz
cancellation_reason text
rating              integer CHECK (rating BETWEEN 1 AND 5)
review              text
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

**Items JSONB structure:**
```json
[
  {
    "menu_item_id": "uuid",
    "name": "Butter Chicken",
    "quantity": 2,
    "unit_price": 320.00,
    "customizations": ["Extra Gravy", "Naan"],
    "modifier_price": 35.00,
    "spice_level": 2,
    "dietary_tags": ["gluten-free"],
    "line_total": 675.00,
    "special_note": "Less spicy please"
  }
]
```

### Order Status Flow
```
Customer places order → pending
Waiter confirms → confirmed
Kitchen starts → preparing
Kitchen finishes → ready
Waiter serves → served
Customer finishes → completed
(At any point before served: can be cancelled)
```

### Admin Orders Dashboard
- Live order feed with realtime updates.
- Filter by status, order type, table, date range, waiter.
- Search by order number or customer name/phone.
- Order detail panel (slide-out): full item list, customer info, timeline, actions.
- Actions: Confirm, Cancel (with reason), Refund (mock), Assign Waiter, Change Table, Mark Ready, Mark Served.
- Bulk actions: Confirm selected, Cancel selected.

### Waiter Terminal (`/waiter`)
- Simplified interface for floor staff.
- Table map view showing all tables with status.
- Current orders per table.
- "New Order" button → quick order form with table selector, menu search, cart.
- Order status updates (drag order to next status).
- Table status toggle (Available/Reserved/Occupied/Cleaning).

---

## 12. Staff Management (`/admin/staff` — Admin Only)

### Staff Profiles
- View all staff (kitchen_staff + waiters) with profiles.
- Card per staff member: avatar, name, role badge, assigned section/tables, today's order count, rating.

### Staff Scheduling
```
public.staff_schedules:
id              uuid PK DEFAULT gen_random_uuid()
staff_id        uuid FK to profiles
shift_date      date
shift_start     time
shift_end       time
role            text — kitchen / waiter / manager
section         text — indoor / outdoor / bar / kitchen
status          text DEFAULT 'scheduled' — scheduled / checked_in / checked_out / absent / leave
checked_in_at   timestamptz
checked_out_at  timestamptz
notes           text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Scheduling Features
- Weekly schedule view (7-day grid) with staff rows and shift columns.
- Drag-and-drop shift assignment.
- Color-coded shifts: Kitchen (orange), Waiter (blue), Manager (gold).
- Conflict detection: overlapping shifts flagged in red.
- Check-in/Check-out: staff member taps button on their profile (or admin marks them).
- Attendance tracking: present / absent / late / leave.
- Hours worked calculation per staff per week.

### Staff Performance Analytics
```
public.staff_performance:
id              uuid PK DEFAULT gen_random_uuid()
staff_id        uuid FK to profiles
period_start    date
period_end      date
total_orders_handled integer
total_revenue_generated numeric(10,2)
average_order_value numeric(10,2)
customer_rating_avg numeric(3,2)
attendance_score numeric(5,2) — percentage
punctuality_score numeric(5,2) — percentage
upsell_count    integer
created_at      timestamptz DEFAULT now()
```

- Per-staff dashboard: orders handled, revenue generated, average order value, customer ratings, attendance %, punctuality %.
- Leaderboard: top-performing staff by revenue, rating, orders.
- Attendance calendar with color-coded days (green=present, red=absent, yellow=late).
- Late arrivals tracked with timestamp.

### Waiter Assignment
- Auto-assign waiters to tables based on shift and section.
- Manual override: drag waiter to table on floor plan.
- Table load balancing: suggest least-busy waiter for new table.
- Per-waiter view: "My Tables" showing currently assigned tables with order status.

---

## 13. Inventory Management (`/admin/inventory` — Admin Only)

### Inventory Items
```
public.inventory_items:
id              uuid PK DEFAULT gen_random_uuid()
name            text NOT NULL — e.g. "Chicken", "Tomatoes", "Rice", "Cooking Oil"
category        text — raw_material / dairy / beverages / packaging / cleaning / spices
unit            text — kg / liter / piece / bunch / packet
current_stock   numeric(10,3) DEFAULT 0
min_stock_level numeric(10,3) — reorder when below this
unit_cost       numeric(10,2) — cost per unit
supplier_id     uuid FK to suppliers (nullable)
storage_location text — cold_storage / dry_storage / freezer / bar
expiry_date     date (nullable)
batch_number    text (nullable)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Stock Tracking / Movements
```
public.stock_movements:
id              uuid PK DEFAULT gen_random_uuid()
item_id         uuid FK to inventory_items
movement_type   text — purchase / consumption / wastage / adjustment / transfer
quantity        numeric(10,3) — positive for purchase, negative for consumption
reason          text — e.g. "Order #ORD-0042", "Spoilage", "Weekly audit"
reference_id    uuid — FK to orders or purchase_orders
recorded_by     uuid FK to profiles
created_at      timestamptz DEFAULT now()
```

### Automated Stock Deduction
- When order is marked "completed" → auto-deduct ingredients from stock based on recipe mapping.
- Recipe mapping stored in `public.recipe_mappings`: menu_item_id → [{inventory_item_id, quantity_used}].
- Partial deduction when order is cancelled (return items to stock).
- Wastage tracking: staff can log wastage with reason (spillage, spoilage, over-preparation).

### Low Stock Alerts
- Alert when `current_stock < min_stock_level`.
- Alert categories: Critical (<25% of min), Warning (<75% of min), Info (below min).
- Alert dashboard card with item name, current stock, min level, suggested reorder quantity.
- Color-coded: Red (critical), Orange (warning), Blue (info).

### Automated Supplier Ordering
- When stock falls below min level for X consecutive days → auto-generate purchase order draft.
- Draft includes: item name, current stock, min level, suggested order quantity (min_level * 2), preferred supplier.
- Admin reviews draft → approves → sends to supplier (mock email).
- Purchase order tracking: pending / sent / confirmed / delivered.
- Supplier delivery tracking: expected date, actual date, quantity received, quality check.

### Suppliers
```
public.suppliers:
id              uuid PK DEFAULT gen_random_uuid()
name            text NOT NULL
contact_person  text
phone           text
email           text
address         text
items_supplied  text[] — list of item categories
rating          numeric(3,2) DEFAULT 0 — 0-5
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()

public.purchase_orders:
id              uuid PK DEFAULT gen_random_uuid()
supplier_id     uuid FK to suppliers
items           jsonb — [{inventory_item_id, name, quantity, unit_cost}]
total_amount    numeric(10,2)
status          text — draft / pending / confirmed / partially_delivered / delivered / cancelled
expected_date   date
delivered_date  date (nullable)
notes           text
created_by      uuid FK to profiles
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Inventory Dashboard
- Stock level overview: all items with current/min/reorder status.
- Wastage chart: daily/weekly/monthly wastage by category.
- Cost analysis: food cost percentage, cost per order, trending costs.
- Expiry tracker: items expiring within 7 days (red alert).
- Quick actions: Add Stock, Log Wastage, Create Purchase Order.

---

## 14. Discounts & Promotions (`/admin/promotions` — Admin Only)

### Discount Codes
```
public.discount_codes:
id              uuid PK DEFAULT gen_random_uuid()
code            text UNIQUE NOT NULL — e.g. "WELCOME20", "FESTIVE50"
description     text
discount_type   text — percentage / fixed_amount / free_item
discount_value  numeric(10,2) — 20 for 20%, 50 for ₹50 off
min_order_value numeric(10,2) DEFAULT 0
max_discount    numeric(10,2) (nullable)
usage_limit     integer — total uses allowed
usage_count     integer DEFAULT 0 — times used
per_user_limit  integer DEFAULT 1
valid_from      timestamptz
valid_until     timestamptz
applicable_categories uuid[] — FK to categories (nullable = all)
applicable_items uuid[] — FK to menu_items (nullable = all)
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### Combo Offers
- Combo meals with discounted pricing (see Menu Management section).
- Time-based offers: "Lunch Special 12-3PM", "Happy Hour 5-7PM".
- Bundle deals: "Buy 2 Get 1 Free", "Family Pack".

### Loyalty Program
- Earn points: ₹1 spent = 1 point.
- Tier thresholds: Bronze (0-500), Silver (500-2000), Gold (2000-5000), Platinum (5000+).
- Tier benefits: Bronze (no discount), Silver (5% off), Gold (10% off + free delivery), Platinum (15% off + priority + birthday bonus).
- Points redemption: 100 points = ₹10 off.
- Birthday bonus: 200 points on birthday month.
- Referral bonus: 500 points for both referrer and referee on first order.

---

## 15. Customer Reviews & Ratings

### Reviews Table
```
public.reviews:
id              uuid PK DEFAULT gen_random_uuid()
order_id        uuid FK to orders UNIQUE — one review per order
customer_id     uuid FK to profiles
rating          integer CHECK (rating BETWEEN 1 AND 5)
food_rating     integer CHECK (1-5) — food quality
service_rating  integer CHECK (1-5) — service quality
ambiance_rating integer CHECK (1-5) — ambiance (dine-in only)
review_text     text
images          text[] — Supabase Storage URLs
is_verified     boolean DEFAULT true — verified purchase
is_featured     boolean DEFAULT false — admin-pinned
helpful_count   integer DEFAULT 0
response_text   text — restaurant response
response_at     timestamptz
created_at      timestamptz DEFAULT now()
```

### Reviews Features
- Customer can review after order is completed (prompted in order tracking).
- Star rating (1-5) for overall + food + service + ambiance.
- Text review with optional photo upload.
- Reviews displayed on menu item pages and restaurant overview.
- "Helpful" button (other customers can mark reviews as helpful).
- Admin response: reply to reviews publicly.
- Featured reviews: admin can pin best reviews to the top.
- Review analytics dashboard: average rating trend, rating by category, sentiment distribution.

---

## 16. Delivery Management (`/admin/delivery` — Admin/Waiter)

### Delivery Partners
```
public.delivery_partners:
id              uuid PK DEFAULT gen_random_uuid()
name            text
phone           text
vehicle_type    text — bike / scooter / car
is_available    boolean DEFAULT true
current_lat     numeric (nullable)
current_lng     numeric (nullable)
rating          numeric(3,2) DEFAULT 0
total_deliveries integer DEFAULT 0
created_at      timestamptz DEFAULT now()
```

### Delivery Tracking
- Assign delivery partner to delivery order.
- Customer sees partner name, vehicle, phone number.
- Mock map showing partner location (placeholder map component).
- Status: Assigned → Picked Up → On the Way → Delivered.
- OTP verification on delivery (customer shares 4-digit OTP with partner).
- Delivery proof: partner marks delivered + customer confirms.

### Delivery Zones & Pricing
```
public.delivery_zones:
id              uuid PK DEFAULT gen_random_uuid()
name            text — e.g. "Zone A - 0-3km", "Zone B - 3-5km"
min_distance_km numeric
max_distance_km numeric
delivery_fee    numeric(10,2)
min_order_value numeric(10,2)
estimated_time  integer — minutes
is_active       boolean DEFAULT true
```

---

## 17. Notifications System

### Notification Types
1. **Order Confirmed** — "Your order #ORD-0042 has been confirmed!"
2. **Order Preparing** — "Your order is being prepared 🔥"
3. **Order Ready** — "Your order is ready! Pick it up at the counter."
4. **Order Served** — "Enjoy your meal! #ORD-0042"
5. **Reservation Confirmed** — "Your table for 4 on Dec 25 at 7:00 PM is confirmed."
6. **Reservation Reminder** — "Reminder: Your reservation is in 1 hour."
7. **Low Stock Alert** — "Chicken stock is critically low (2kg remaining)."
8. **New Order (Kitchen)** — "New order #ORD-0043 from Table T5"
9. **Staff Schedule** — "Your shift tomorrow is 10 AM - 6 PM."
10. **Review Request** — "How was your order? Rate your experience."

### Notification Channels
- **In-app:** Primary, stored in `public.notifications`.
- **SMS:** Via Twilio stub (dev: console log with SMS content).
- **Email:** Via Resend stub (dev: console log with email content).

### In-App Notification Center
- Bell icon in header with red badge for unread count.
- Dropdown: Today / Earlier sections, mark all read.
- Click → navigates to relevant page.

### Persistence
```
public.notifications:
id              uuid PK DEFAULT gen_random_uuid()
user_id         uuid FK to profiles
type            text — order / reservation / stock / schedule / review
title           text
message         text
data            jsonb — order_id, table_id, etc.
read            boolean DEFAULT false
channel         text — in_app / sms / email
created_at      timestamptz DEFAULT now()

public.notification_prefs:
id              uuid PK DEFAULT gen_random_uuid()
user_id         uuid FK to profiles
notification_type text
in_app_enabled  boolean DEFAULT true
sms_enabled     boolean DEFAULT false
email_enabled   boolean DEFAULT false
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

---

## 18. Reports & Analytics (`/admin/reports` — Admin Only)

### Sales Reports
- Daily/Monthly/Yearly sales summary (total orders, revenue, average order value).
- Sales by category (which menu categories generate most revenue).
- Sales by item (top-selling items, worst-performing items).
- Sales by time slot (peak hours analysis).
- Sales by order type (dine-in / takeaway / delivery split).
- Payment method breakdown (cash vs card vs UPI).
- Recharts: line chart (revenue over time), bar chart (sales by category), pie chart (order type split), heatmap (busiest hours/days).

### Demand Forecasting
- Historical order data used to predict demand for each menu item.
- Day-of-week pattern: "Biryani sells 40% more on Fridays."
- Time-of-day pattern: "Peak lunch: 12:30-2:00 PM, Peak dinner: 8:00-10:00 PM."
- Pre-prep suggestions: "Prepare 30 extra butter chicken portions for Saturday dinner based on last 4 Saturdays."
- Seasonal trends: "Cold drinks sell 200% more in April-May."

### Inventory Reports
- Wastage report: items with highest wastage, cost of wastage, wastage by reason.
- Stock valuation: current inventory value.
- Purchase order history: amounts, suppliers, delivery timelines.
- Supplier performance: delivery time, quality, cost comparison.

### Staff Performance Reports
- Per-staff: orders handled, revenue, avg order value, attendance, punctuality, customer ratings.
- Shift coverage analysis: understaffed/overstaffed shifts.
- Table turnover time per waiter.

### Customer Analytics
- Customer retention: new vs returning customers.
- Average visit frequency.
- Average spend per customer.
- Dietary preference distribution.
- Peak reservation times.

### Export
- All reports exportable as PDF (jsPDF + jspdf-autotable).
- Sales data exportable as CSV.

---

## 19. Community Feed & Reviews (`/community` — All Users)

### Feed Design
- Infinite scroll feed of restaurant updates, customer photos, announcements.
- Post types: Announcement (admin), Photo (customer), Review highlight (auto).

### Admin Posts
- Admin can create posts: text, images, announcements.
- "Special of the Day" posts with item image and description.
- Event posts: "Live Music Night this Saturday!"
- Announcement posts: "New menu items added", "Holiday hours".

### Customer Photo Feed
- Customers can upload photos of their food/experience.
- Auto-suggested from review images.
- Like and comment on posts.

### Moderation
- Admin can delete any post.
- Report button on posts (reported content goes to moderation queue).

---

## 20. Loyalty & Rewards Program (`/rewards` — Customer)

### Points System
- Earn points on every purchase (₹1 = 1 point).
- Bonus points: First order (+100), Referral (+500 for both), Birthday (+200), Review (+50), Social share (+25).

### Tier Benefits
| Tier | Min Points | Discount | Benefits |
|------|-----------|----------|----------|
| Bronze | 0 | None | Basic account |
| Silver | 500 | 5% off | Priority reservations |
| Gold | 2000 | 10% off | Free delivery, birthday bonus |
| Platinum | 5000 | 15% off | Priority + exclusive menu items + events |

### Rewards Page
- Current tier card with progress bar to next tier.
- Points balance with recent transaction history.
- Available rewards catalog: discount vouchers, free items, experiences.
- Redeem flow: select reward → confirm → voucher code generated → applied to next order.
- Referral section: share referral code/link, track referrals and their status.

### Persistence
```
public.loyalty_transactions:
id              uuid PK DEFAULT gen_random_uuid()
customer_id     uuid FK to profiles
type            text — earned / redeemed / bonus / referral / expired
points          integer — positive for earned, negative for redeemed
description     text — e.g. "Order #ORD-0042", "Redeemed ₹100 off"
reference_id    uuid — FK to orders or reward_catalog
created_at      timestamptz DEFAULT now()
```

---

## 21. Landing Page (`/`)

- Full warm dark background (`#0F0A07`).
- **Hero Section:** Restaurant name in Playfair Display 900, tagline, CTA "View Menu" button (gold, large), background image (restaurant interior via Unsplash).
- **Featured Items Carousel:** Auto-scrolling cards of best-sellers with image, name, price, "Order Now" button.
- **How It Works:** 3 steps — "Browse Menu" → "Place Order" → "Enjoy!" with icons.
- **Why Choose Us:** 4 feature cards — Fresh Ingredients, Fast Service, Easy Online Ordering, Great Deals.
- **Testimonials:** Customer review cards with star ratings.
- **Gallery:** 6-photo grid of food/restaurant interior.
- **Info Section:** Address, hours, phone, email with icons.
- **Footer:** Links (About, Menu, Privacy, Terms), social media icons, copyright.
- **SEO:** title, description, OG tags, Twitter card on every page.

---

## 22. Login & Signup

### Customer Login/Signup
- Clean card-based form on warm dark background.
- Login: Email, Password, "Forgot Password" link, Phone OTP option.
- Signup: Full Name, Email, Phone, Password, Dietary Preferences (multi-select chips: Vegetarian, Vegan, Gluten-Free, Jain, Nut-Free, Dairy-Free, No Preference).
- On signup: auto-apply first-order discount code, award welcome bonus points.
- Password reset at `/reset-password`.

### Staff Login (Separate Flow)
- Staff use same auth but role-based redirect:
  - Admin → `/admin/dashboard`
  - Kitchen Staff → `/kds`
  - Waiter → `/waiter`

---

## 23. Navigation

### Customer Navigation
- Top header: Logo, Menu link, Search icon, Cart icon (with item count badge), Notifications bell, User avatar dropdown (Orders, Reservations, Rewards, Profile, Sign Out).
- Mobile: bottom tab bar (Menu, Orders, Cart, Rewards, Profile).

### Admin Navigation (Left Sidebar)
- Dashboard, Menu Management, Orders, Tables & Reservations, Inventory, Staff, Delivery, Reports, Promotions, Settings, Sign Out.

### KDS Navigation
- Minimal: Order filter tabs, settings gear icon, clock, order count.

### Routes Summary
| Path | Audience | Description |
|------|----------|-------------|
| `/` | All | Landing page |
| `/menu` | All | Public menu (no login) |
| `/login`, `/signup` | All | Auth pages |
| `/orders` | Customer | Order history & tracking |
| `/reserve` | Customer | Make reservation |
| `/rewards` | Customer | Loyalty program |
| `/profile` | Customer | Profile & preferences |
| `/admin` | Admin | Admin dashboard |
| `/admin/menu` | Admin | Menu management |
| `/admin/orders` | Admin | Order management |
| `/admin/tables` | Admin | Table management |
| `/admin/reservations` | Admin | Reservation management |
| `/admin/inventory` | Admin | Inventory & stock |
| `/admin/staff` | Admin | Staff management |
| `/admin/delivery` | Admin | Delivery management |
| `/admin/reports` | Admin | Analytics & reports |
| `/admin/promotions` | Admin | Discounts & promotions |
| `/admin/settings` | Admin | Restaurant settings |
| `/kds` | Kitchen Staff | Kitchen Display System |
| `/waiter` | Waiter | Waiter terminal |

---

## 24. Admin Dashboard (`/admin`)

### Overview Cards
- **Today's Revenue:** Total revenue today with trend vs yesterday (↑ 12%).
- **Today's Orders:** Count with trend, dine-in/takeaway/delivery split.
- **Active Orders:** Currently active orders count (preparing + ready).
- **Table Status:** Available / Occupied / Reserved / Cleaning counts.
- **Reservations Today:** Count + next upcoming reservation.
- **Low Stock Alerts:** Count of items below min stock (red if any critical).

### Live Activity Feed
- Real-time feed of new orders, status changes, new reservations.
- Each entry: icon, description, timestamp, link to detail.
- Auto-scrolls with new entries.

### Quick Actions
- Add Menu Item, New Reservation, Stock Alert, Generate Report.

---

## 25. Customer Profile (`/profile`)

### Profile Sections
- **Personal Info:** Name, Email, Phone, Address (editable).
- **Dietary Preferences:** Multi-select chips (Vegetarian, Vegan, Gluten-Free, Jain, Nut-Free, Dairy-Free, Egg-Free, None). Visual indicator on profile.
- **Allergies:** Free-text entry, displayed as warning tags.
- **Order History:** Past orders with reorder button.
- **Favorites:** Saved favorite items for quick reorder.
- **Reservation History:** Past and upcoming reservations.
- **Loyalty Status:** Current tier, points balance, progress to next tier.
- **Notification Preferences:** Toggle order updates, reservation reminders, promotional offers.

---

## 26. Search & Filters (Global)

- Search bar in header: search across menu items by name/description/category.
- Debounced 200ms, results dropdown with item image, name, price.
- "Add to Cart" directly from search results.
- Category filter pills on menu page.
- Dietary filter toggle (persists across session).
- Price range slider (optional, for menu browsing).
- Sort: Popular / Price Low-High / Price High-Low / Newest / Name A-Z.

---

## 27. Notifications & Communication

### Order Notifications
- Customer receives at each stage: Confirmed → Preparing → Ready → Delivered.
- Via in-app + SMS (stub).

### Reservation Notifications
- Confirmation SMS/Email after booking.
- 1-hour reminder SMS/Email before reservation.
- Day-of reminder.

### Promotional Notifications
- Admin can send broadcast: "New weekend special! 20% off all pasta dishes."
- Target: All customers / Specific dietary group / Segment.

### Table Ready Notification
- Kitchen marks order "Ready" → Waiter notified → Waiter serves → Customer notified.
- Display at waiter terminal: "Order #ORD-0042 ready for Table T5."

---

## 28. Database Schema Summary

### Complete Table List (30+ tables)
```
public.profiles          — User profiles (customers, staff, admins)
public.user_roles        — Role assignments
public.settings          — Restaurant configuration
public.operating_hours   — Weekly schedule
public.special_days      — Holiday/closures
public.categories        — Menu categories
public.menu_items        — Menu items with customizations
public.combo_meals       — Combo/deal items
public.price_history     — Price change tracking
public.orders            — Order headers
public.order_items       — (embedded in orders.items jsonb)
public.tables            — Restaurant tables
public.reservations      — Table reservations
public.reviews           — Customer reviews & ratings
public.inventory_items   — Inventory/stock items
public.stock_movements   — Stock in/out tracking
public.recipe_mappings   — Menu item → ingredients mapping
public.suppliers         — Supplier directory
public.purchase_orders   — Purchase order tracking
public.staff_schedules   — Staff shift scheduling
public.staff_performance — Staff analytics
public.loyalty_transactions — Points earning/redemption
public.discount_codes    — Promo codes
public.reward_catalog    — Available rewards
public.delivery_partners — Delivery staff
public.delivery_zones    — Delivery area config
public.chat_messages     — Support chat
public.notifications     — In-app notifications
public.notification_prefs — Notification settings
public.audit_log         — Security audit trail
public.analytics_events  — Event tracking for analytics
```

### Indexes
Every table has: index on `id`, index on `created_at`. Additional: `(customer_id, created_at)` on orders, `(table_id, reservation_date)` on reservations, `(item_id, movement_type, created_at)` on stock_movements, `(order_number)` on orders for fast lookup.

---

## 29. Edge Functions (Backend Logic)

All Edge Functions are Deno-based, deployed via Supabase Edge Functions, with Zod validation for inputs/outputs.

| Function | Purpose | Trigger |
|----------|---------|---------|
| `generate-order-number` | Generate sequential order number (ORD-XXXX) | Called before order creation |
| `process-payment` | Mock payment processing | On checkout submit |
| `send-notification` | Send SMS/Email/In-app notification | On order status change, reservation |
| `deduct-stock` | Auto-deduct ingredients on order completion | On order status → completed |
| `return-stock` | Return ingredients on order cancellation | On order status → cancelled |
| `check-low-stock` | Check all items below min stock, create alerts | Cron: every 6 hours |
| `generate-purchase-order` | Auto-generate PO draft for low stock | Triggered by check-low-stock |
| `calculate-loyalty-points` | Award points after order completion | On order → completed |
| `generate-kds-qr` | Generate QR code for table | On table create/update |
| `generate-invoice` | Generate PDF invoice for order | On demand (admin/waiter) |
| `process-refund` | Mock refund processing | Admin action |
| `daily-report` | Generate daily sales summary | Cron: daily midnight |
| `monthly-report` | Generate monthly analytics | Cron: 1st of month |

---

## 30. Scheduled Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| `0 0 * * *` | daily-report | Nightly: sales summary, low stock check, auto-PO generation |
| `0 0 * * 0` | weekly-report | Sunday: weekly analytics, staff performance |
| `0 0 1 * *` | monthly-report | 1st: monthly financial report, inventory valuation |
| `*/30 * * * *` | check-low-stock | Every 30 min: scan inventory, alert on low stock |
| `0 8 * * *` | reservation-reminder | Daily 8 AM: send reminders for today's reservations |
| `0 14 * * *` | reservation-reminder-2pm | 2 PM: send reminders for evening reservations |

---

## 31. Testing Requirements

### Test Framework
- Vitest with `vitest.config.ts` (jsdom environment for component tests).
- React Testing Library for component tests.
- MSW (Mock Service Worker) for API mocking.

### Test Suites (All Must Pass)
1. **Order Number Generation:** Sequential format "ORD-0001" → "ORD-0042". No duplicates. Persists across restarts.
2. **Order Total Calculation:** Subtotal + tax + service charge - discount = total. Test with multiple items, customizations, discount codes.
3. **Cart Logic:** Add item, increase quantity, decrease quantity, remove item, apply customization, calculate totals.
4. **Dietary Filtering:** Filter menu by dietary preference. Vegetarian filter shows only veg items. Multiple filters combine correctly.
5. **Table Status Flow:** Available → Reserved → Occupied → Cleaning → Available. Cannot occupy an already occupied table.
6. **Reservation Conflict:** Cannot double-book same table at same time. Validates within operating hours.
7. **Stock Deduction:** Order completion deducts correct quantities per recipe mapping. Cancellation returns stock.
8. **Loyalty Points:** Correct points earned per order, correct redemption, tier upgrade thresholds.
9. **Role-Based Access:** Each role can/cannot access routes. Test all 5 roles against all routes.
10. **Discount Code Validation:** Valid code applies discount, expired code rejected, usage limit enforced, min order value checked.
11. **Auth Redirects:** Unauthenticated users redirected to login. Access denied for wrong role.
12. **Audit Log:** Actions create correct audit entries with actor, action, details.
13. **Menu Item Availability:** Toggle availability instantly reflects on public menu. Sold-out items cannot be added to cart.

### Quality Gates
- All tests pass: `vitest run` → 0 failures.
- TypeScript: `tsc --noEmit` → 0 errors.
- Build: `vite build` → 0 errors, no warnings.
- Browser console: 0 errors on all main routes.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 95, SEO ≥ 90.

---

## 32. Performance Optimization

- **Code Splitting:** Every route lazy-loaded with `React.lazy()` + `Suspense` + skeleton loader.
- **Image Optimization:** Supabase Storage image transforms (width, quality, format webp). Lazy loading with Intersection Observer.
- **Realtime Optimization:** Subscribe to Realtime channels only when KDS/waiver view is active. Unsubscribe on unmount.
- **Query Caching:** TanStack Query with `staleTime: 2min` for menu data, `staleTime: 30s` for orders (realtime updates bypass cache).
- **Debounced Search:** 200ms debounce on menu search, order search.
- **Virtualized Lists:** `react-virtuoso` for long order lists, menu items with 100+ items.
- **Bundle Budget:** Initial JS < 200KB gzipped. Per-route chunk < 50KB gzipped.
- **Font Loading:** `font-display: swap`, preload Inter and Playfair Display.

---

## 33. Deployment & Publishing on Lovable

### Deploy Steps
1. In Lovable dashboard → click "Publish".
2. Lovable Cloud (Supabase) auto-configured if "Backend" was enabled.
3. Set environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (auto-populated).
4. Edge Function secrets: `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (set via Lovable → Backend → Secrets).
5. Custom domain: Lovable → Settings → Domains → add custom domain.
6. SSL: Automatically provisioned by Lovable.
7. Enable GitHub sync for version control.

### Secrets (Never in Client Code)
```
SUPABASE_SERVICE_ROLE_KEY   → Edge Functions only
RESEND_API_KEY              → Edge Functions only
TWILIO_ACCOUNT_SID          → Edge Functions only
TWILIO_AUTH_TOKEN           → Edge Functions only
VITE_SUPABASE_URL           → Client-safe
VITE_SUPABASE_ANON_KEY      → Client-safe
```

### Post-Deploy Checklist
- [ ] Protected routes gated (try `/kds` without kitchen_staff role).
- [ ] Public menu accessible without login (`/menu`).
- [ ] RLS policies active.
- [ ] Supabase Auth flows work (signup, login, password reset).
- [ ] Realtime works (new order appears in KDS instantly).
- [ ] QR code generation works for tables.
- [ ] No console errors on any page.
- [ ] All tests pass in production build.

---

## 34. Security, Privacy & Compliance

### Row Level Security (RLS)
- Every `public` table has RLS enabled with role-specific policies.
- Policy pattern: `USING (has_role(auth.uid(), 'required_role') OR auth.uid() = user_id)`.
- Super_admin bypasses all RLS.
- Customers can only see their own orders and reviews.
- Kitchen staff can only update order status, not view/modify prices.
- Staff can only see data relevant to their section/role.

### Data Protection
- Passwords handled by Supabase Auth (never in app tables).
- All Supabase Storage buckets have RLS: users can only access their own uploads.
- Order data retained for 2 years (compliance), then anonymized.
- Customer PII (phone, address) encrypted at rest in Edge Functions before insert.
- PCI compliance note: Payment data never touches our servers (mock only).

### Audit & Compliance
- All admin/staff actions logged to `public.audit_log`.
- Order status changes logged with actor, timestamp, old/new status.
- Price changes logged with old/new price, actor, timestamp.
- Stock movements logged with full context.
- GDPR-style: customer data export, account deletion (soft delete with 30-day restore).

### Rate Limiting
- Auth endpoints: 10 attempts/minute per IP.
- Order placement: 5 orders/minute per customer (prevent spam).
- API endpoints: 100 requests/minute per user.

---

## 35. PWA & Mobile Experience

### Progressive Web App
- `manifest.json`: name "CHEFSTATION", theme_color `#0F0A07`, display standalone.
- Service Worker: cache static assets, stale-while-revalidate for menu data.
- Offline: cached menu viewable offline. Orders queued for sync when back online.

### Mobile Optimizations
- Touch-friendly: minimum 44×44px tap targets.
- Swipe gestures: swipe order card for quick actions (confirm/cancel).
- Pull-to-refresh on order list.
- Bottom-safe-area padding for notched phones.
- QR scanner: use camera to scan table QR code (alternative to typing table number).

---

## 36. Accessibility (WCAG 2.1 AA)

- Full keyboard navigation on all interactive elements.
- Focus ring: `focus:ring-2 focus:ring-[#D4A017] focus:ring-offset-2`.
- ARIA labels on all icon-only buttons.
- ARIA live regions for order status updates ("Order #ORD-0042 is now ready").
- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<article>` for order cards.
- Color contrast ≥ 4.5:1 for all text.
- `prefers-reduced-motion` support.
- Screen reader announcements for new KDS orders, status changes.

---

## 37. Out of Scope (Explicitly Not Building)

- Real payment processing — Stripe/PayPal is stubbed (mock checkout only).
- Real SMS/Email — Twilio/Resend stubbed (dev: console log).
- Native iOS/Android apps — PWA only.
- Real GPS delivery tracking — mock map placeholder.
- Real Kitchen Printer integration — browser print stub only.
- Multi-restaurant/chain support — single restaurant only.
- Supplier marketplace — internal supplier directory only.
- Advanced accounting (P&L, balance sheet) — sales reports only.

---

## Goal

Produce a **professional, warm-themed restaurant operations platform** with:

- Customer-facing: beautiful menu browsing with dietary filters, QR-based contactless ordering, smooth checkout flow, order tracking with realtime updates, reservation system, loyalty program with tiered rewards.
- Staff-facing: Kitchen Display System (KDS) with realtime order flow, priority-based sorting, color-coded urgency; Waiter terminal with table management; Admin dashboard with comprehensive analytics.
- Backend: robust Postgres schema with 30+ tables, RLS security, automated stock deduction, low-stock alerts with auto-PO generation, staff scheduling with attendance tracking, performance analytics, cron jobs for reports and alerts.
- Realtime: order status sync between customer → kitchen → waiter → customer, table status updates.
- Design: warm dark theme with gold accents — professional, premium restaurant feel across every screen.

The app must feel like a **premium restaurant operating system** — efficient for staff, delightful for customers, with warm gold accents on a dark canvas that evokes the ambiance of an upscale dining experience.

---
