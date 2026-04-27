# Onvio — Client Onboarding Platform

> Onboard + Via (Latin for "path") · Your path to go-live

A purpose-built client onboarding and project management platform for the Unicommerce implementation team — designed to scale across any organisation.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 | Framework + API Routes |
| Supabase | Database + Auth + Storage |
| Tailwind CSS + shadcn | UI |
| Resend | Transactional Email |
| Vercel | Hosting + Cron Jobs |
| GitHub | Version Control |

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_ORG/onvio.git
cd onvio
npm install
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Run the seed: `supabase/seed/001_unicommerce_seed.sql`

### 3. Configure environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, service role key, Resend API key
```

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Authenticated app shell
│   │   ├── manager/           # Manager war room
│   │   ├── lead/              # Lead team view
│   │   ├── om/                # OM project list
│   │   └── settings/          # Org/team/template settings
│   ├── projects/
│   │   ├── new/               # Create project (multi-step)
│   │   └── [id]/
│   │       ├── tracker/       # Phase/task tracker
│   │       └── dashboard/     # Project dashboard + activity log
│   ├── portal/[token]/        # Client-facing portal
│   └── api/
│       ├── projects/          # CRUD
│       ├── tasks/             # Task status updates
│       ├── emails/            # Send welcome/dashboard emails
│       └── cron/              # Reminder + RAG cron jobs
├── components/
│   ├── layout/AppShell.tsx    # Sidebar + topbar
│   ├── tracker/               # Tracker + new project form
│   ├── dashboard/             # Manager/Lead/OM dashboards
│   └── portal/                # Client portal
├── lib/
│   ├── supabase/              # Client, server, admin, middleware
│   └── types/                 # TypeScript types
└── styles/

supabase/
├── migrations/001_initial_schema.sql   # Full DB schema
└── seed/001_unicommerce_seed.sql       # Unicommerce data + B2C template
```

## Roles

| Role | Access |
|------|--------|
| Manager | All projects, war room, settings |
| Lead | Their team's projects only |
| OM | Their own projects |
| Client | Portal only (token-based) |

## Deployment

### Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — crons auto-configure from `vercel.json`

### Railway + Supabase
1. Create a new Railway service from this repository.
2. Set the start/build commands (already provided in `nixpacks.toml`).
3. Add the same environment variables used locally:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set this to your Railway public URL)
   - `RESEND_API_KEY`, `RESEND_FROM_DOMAIN`, and `CRON_SECRET`
4. In Supabase Auth settings, add these URLs:
   - Site URL: your Railway public URL
   - Redirect URL: `https://<your-railway-domain>/auth/callback`
5. Redeploy and test `/login`, password login, magic link login, and `/auth/callback`.
6. (Optional) Run a preflight check before go-live:
   - `npm run ops:check-env`
   - Health endpoint: `/api/health/auth`

## Build Plan

**Phase 1 (Weeks 1–10):** Core platform, tracker, dashboards, client portal, email, cron engine
**Phase 2 (Weeks 11–16):** HubSpot, Jira, Confluence, WhatsApp, Calendar integrations

---

Built by Unicommerce · Designed to scale
