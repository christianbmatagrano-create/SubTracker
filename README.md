# SubTracker

Track all your subscriptions and get email reminders before each billing date. Free to run on Vercel + Supabase + Resend.

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Supabase** — Postgres database + auth (free tier)
- **Resend** — transactional emails (free: 3,000/month)
- **Vercel** — hosting + daily cron job (free)

---

## Setup (20 minutes)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/subtracker.git
cd subtracker
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. After it's created, go to **SQL Editor**
3. Copy the entire contents of `supabase-schema.sql` and run it
4. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create a Resend account

1. Go to [resend.com](https://resend.com) → sign up free
2. Create an API key → `RESEND_API_KEY`
3. For the sender email (`RESEND_FROM_EMAIL`):
   - **Quick start**: use `onboarding@resend.dev` (Resend's domain, works immediately)
   - **Production**: add and verify your own domain in Resend, then use `reminders@yourdomain.com`

### 4. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### One-time setup

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) → New Project.

### Add environment variables in Vercel

Go to your project → **Settings → Environment Variables** and add all variables from `.env.local.example`.

**Important**: The cron job runs automatically via `vercel.json`. It hits `/api/cron/send-reminders` every day at 9am UTC. Vercel sets the `Authorization: Bearer <CRON_SECRET>` header automatically — just make sure `CRON_SECRET` is set in your Vercel env vars.

---

## Billing cycles supported

| Cycle | Period |
|-------|--------|
| Daily | Every day |
| Weekly | Every 7 days |
| Bi-weekly | Every 14 days |
| Monthly | Once a month |
| Quarterly | Every 3 months |
| Semi-annual | Every 6 months |
| Annual | Once a year |

---

## How reminders work

1. Every day at 9am UTC, Vercel runs the cron job
2. The cron checks all active subscriptions
3. For each subscription, it checks if today matches any configured reminder day (e.g., 7 days before billing)
4. If it does — and the reminder hasn't been sent yet — it fires an email via Resend
5. A log entry is written to prevent duplicate sends

You can configure reminder days per subscription (e.g., 14 days, 7 days, 3 days, 1 day).

---

## Project structure

```
subtracker/
├── app/
│   ├── page.tsx                    ← landing page / auth
│   ├── dashboard/page.tsx          ← main dashboard (protected)
│   ├── api/
│   │   ├── subscriptions/route.ts  ← CRUD API
│   │   └── cron/send-reminders/    ← daily email cron
│   └── globals.css
├── components/
│   ├── AuthForm.tsx
│   ├── SubCard.tsx
│   ├── AddSubModal.tsx
│   └── SettingsModal.tsx
├── lib/
│   ├── supabase.ts                 ← DB client + types
│   ├── billing.ts                  ← cycle utils, formatting
│   └── email.ts                    ← Resend email sender
├── supabase-schema.sql             ← run this in Supabase
└── vercel.json                     ← cron schedule
```

---

## Notes

- All subscription amounts are stored in USD. Multi-currency display is supported but conversion is not.
- Monthly spend calculation normalizes all cycles to a monthly equivalent for the dashboard total.
- The reminder log uses a unique constraint on `(subscription_id, days_before, billing_date)` to prevent duplicate emails even if the cron runs twice.
