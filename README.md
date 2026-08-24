# Jupiter Gym - QR Attendance Management System

A complete, mobile-first gym management system with QR-code-based check-in, member management, attendance tracking, payments, and WhatsApp reminders. Built with TanStack Start (React SSR), Supabase, and Tailwind CSS.

---

## Features

- **QR Code Check-In** - One static QR code at the gym entrance. Members scan, enter mobile number, and check in instantly.
- **Auto Registration** - First-time visitors get a quick registration form (name, mobile, plan). No app download needed.
- **Admin Dashboard** - Live metrics: total members, today's attendance, expiring/expired memberships, monthly revenue, attendance trends.
- **Member Management** - Add, edit, renew, delete members. Search and filter. Excel export.
- **Payments & Revenue** - Record payments, track paid/pending/overdue status, chase dues via WhatsApp.
- **Attendance Logs** - Filter by date, search by name/mobile, 7-day averages, Excel export.
- **WhatsApp Reminders** - One-click WhatsApp messages for expiring memberships and pending dues.
- **Dark/Light Mode** - Premium dark-first design with light mode toggle.
- **Admin Only Access** - Dashboard restricted to gym owner (admin role). Staff accounts can be blocked.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19 SSR) |
| Router | TanStack Router (file-based) |
| State | TanStack React Query |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| QR Code | qrcode.react |
| Excel Export | SheetJS (xlsx) |
| Dates | Day.js |
| Icons | Lucide React |
| Backend | Supabase (Auth + PostgreSQL + RLS) |
| Server | Nitro (Vercel adapter) |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## Project Structure

```
fitness-qr-spark/
├── public/                          # Static assets (favicon, robots.txt)
├── supabase/
│   ├── config.toml                  # Supabase project config
│   └── migrations/                  # SQL migrations (schema, RLS, triggers)
├── src/
│   ├── components/
│   │   ├── AdminShell.tsx           # Admin layout with sidebar nav
│   │   ├── EmptyState.tsx           # Empty/Loading/Error state components
│   │   ├── StatCard.tsx             # Dashboard metric card
│   │   ├── StatusBadge.tsx          # Colored status pill badge
│   │   ├── ThemeToggle.tsx          # Dark/light mode toggle
│   │   └── ui/                      # 45+ shadcn/ui components (Radix-based)
│   ├── config/
│   │   └── gym.ts                   # Gym config: name, currency, plans, pricing
│   ├── hooks/
│   │   ├── useGymData.ts            # React Query hooks for members/attendance/payments
│   │   ├── useTheme.ts              # Theme persistence hook
│   │   └── use-mobile.tsx           # Mobile breakpoint detection
│   ├── integrations/supabase/
│   │   ├── client.ts                # Client-side Supabase (publishable key, RLS)
│   │   ├── client.server.ts         # Server-side Supabase (service role, bypasses RLS)
│   │   ├── types.ts                 # Auto-generated database types
│   │   ├── auth-middleware.ts        # Server auth middleware
│   │   ├── auth-attacher.ts         # Client auth token attach middleware
│   │   └── cron-auth.ts             # Cron job authentication
│   ├── lib/
│   │   ├── checkin.functions.ts     # Public server functions (check-in, registration)
│   │   ├── dashboard.functions.ts   # Admin server functions (CRUD, all DB operations)
│   │   ├── error-capture.ts         # Global error interceptor
│   │   ├── error-page.ts            # Server-side error page renderer
│   │   └── utils.ts                 # cn() Tailwind class merger
│   ├── routes/
│   │   ├── __root.tsx               # Root layout (fonts, QueryClient, auth listener)
│   │   ├── index.tsx                # Public check-in page (/)
│   │   ├── auth.tsx                 # Login/signup page (/auth)
│   │   └── _authenticated/
│   │       ├── route.tsx            # Auth guard (admin-only role check)
│   │       ├── dashboard.tsx        # Admin dashboard (/dashboard)
│   │       ├── members.tsx          # Member management (/members)
│   │       ├── attendance.tsx       # Attendance logs (/attendance)
│   │       ├── payments.tsx         # Payments & revenue (/payments)
│   │       └── qr-code.tsx          # QR code display (/qr-code)
│   ├── services/
│   │   └── gym.ts                   # Client-side Supabase queries (legacy, mostly replaced)
│   ├── utils/
│   │   ├── validation.ts            # Zod schemas for all forms
│   │   ├── format.ts                # Date/money/status formatting + WhatsApp helpers
│   │   └── excel.ts                 # Excel export utility
│   ├── router.tsx                   # TanStack Router instance
│   ├── routeTree.gen.ts             # Auto-generated route tree
│   ├── server.ts                    # Custom server entry (error handling)
│   ├── start.ts                     # TanStack Start bootstrap (middleware)
│   └── styles.css                   # Global design system (oklch colors, fonts)
├── .env.example                     # Environment variable template
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite + TanStack Start + Nitro config
└── components.json                  # shadcn/ui config
```

---

## How It Works

### Check-In Flow

```
Member scans QR code at gym entrance
          │
          ▼
    Opens "/" (public check-in page)
          │
          ▼
  Enters mobile number → submit
          │
          ▼
  checkInByMobile (server function)
    ├─ Looks up member in database
    ├─ If not found → shows registration form
    ├─ If expired → shows "renew" message
    ├─ If already checked in today → shows "already" message
    └─ If valid → inserts into attendance table → shows confirmation
          │
          ▼
  Admin dashboard auto-refreshes (10s polling)
  and shows the new check-in in the live feed
```

### Registration Flow (New Member)

```
Unknown mobile → registration form appears
          │
          ▼
  Fills: name, mobile, age (optional), gender (optional), plan
          │
          ▼
  registerMember (server function)
    ├─ Creates member record (unique code: JG-XXXX)
    ├─ Calculates expiry date based on plan
    ├─ Creates first attendance record
    └─ Returns confirmation with member details
```

### Admin Dashboard Flow

```
Admin logs in at /auth → redirected to /dashboard
          │
          ▼
  beforeLoad checks: is user authenticated? + has admin role?
    ├─ No → signed out, redirected to /auth
    └─ Yes → dashboard loads
          │
          ▼
  Fetches data via server functions (service-role, bypasses RLS)
    ├─ Members (10s auto-refresh)
    ├─ Attendance (10s auto-refresh)
    └─ Payments (30s auto-refresh)
          │
          ▼
  Displays:
    ├─ Stat cards (members, attendance, revenue)
    ├─ 14-day attendance bar chart
    ├─ 6-month revenue line chart
    ├─ Live check-in feed (latest 8)
    └─ Expiring memberships with WhatsApp reminder buttons
```

---

## Database Schema

```
auth.users (Supabase managed)
    │
    ├── profiles          (id, full_name, email, created_at)
    ├── user_roles        (user_id, role: 'admin' | 'staff')
    │
    ▼
members                   (id, member_code, name, mobile, age, gender,
    │                      plan, plan_price, join_date, expiry_date,
    │                      payment_status, notes, created_at, updated_at)
    │
    ├── attendance        (id, member_id, check_in_date, check_in_at)
    │                     UNIQUE(member_id, check_in_date) — one per day
    │
    └── payments          (id, member_id, amount, paid_on, method,
                           status, note, created_at)

Functions:
  has_role(user_id, role)           — checks user_roles table
  handle_new_user()                 — auto-creates profile + admin role on signup
  touch_updated_at()                — auto-updates updated_at on member edits
```

---

## Server Functions vs Client Queries

All database **write operations** (insert, update, delete) and **dashboard reads** go through **server functions** that use the service-role Supabase client (`supabaseAdmin`), which bypasses Row Level Security (RLS).

| Operation | Where | Client |
|-----------|-------|--------|
| Check-in / Registration | `src/lib/checkin.functions.ts` | `supabaseAdmin` (server) |
| Dashboard data fetch | `src/lib/dashboard.functions.ts` | `supabaseAdmin` (server) |
| Member CRUD | `src/lib/dashboard.functions.ts` | `supabaseAdmin` (server) |
| Payment insert/update | `src/lib/dashboard.functions.ts` | `supabaseAdmin` (server) |

---

## Security

- **RLS (Row Level Security)** - Database-level access control. Only admin role can read/write members, attendance, payments.
- **Server Functions** - All DB writes run server-side with service-role key. Client never touches the database directly for mutations.
- **Auth Guard** - `_authenticated/route.tsx` checks both Supabase auth AND admin role before allowing access.
- **Admin Only** - Non-admin users are signed out immediately and redirected to login.
- **Input Validation** - All forms validated with Zod schemas before reaching the server.

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Server-side (Supabase dashboard → Settings → API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
CRON_SECRET=your-cron-secret
```

---

## Development

```sh
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Lint
npm run lint

# Format
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Deployment

### Vercel

1. Push to GitHub
2. Import repository in Vercel dashboard
3. Vercel auto-detects TanStack Start + Nitro
4. Add environment variables in Vercel project settings
5. Deploy

### Supabase

1. Run migrations in order from `supabase/migrations/`
2. Enable Auth providers as needed
3. Set up RLS policies (included in migrations)

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/config/gym.ts` | Change gym name, pricing, currency here |
| `src/lib/checkin.functions.ts` | Check-in and registration logic |
| `src/lib/dashboard.functions.ts` | All admin CRUD operations |
| `src/routes/_authenticated/route.tsx` | Auth guard (admin-only) |
| `src/hooks/useGymData.ts` | Data fetching with polling intervals |
| `src/styles.css` | Design system (colors, fonts, animations) |
| `supabase/migrations/` | Database schema and security rules |
