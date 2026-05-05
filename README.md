# Keltech Legal Tracker

Internal legal operations tracker for Keltech Infrastructure Ltd. The app includes matter tracking, matter detail pages, a calendar grid, task tracking with optional matter links, INR monthly budget tracking, matter-linked documents, counterparty grouping/autofill, recent activity, individual login wiring, and a mandatory audit log.

## Run Locally

```bash
npm.cmd install
npm.cmd run dev
```

PowerShell may block `npm.ps1` on this machine, so `npm.cmd` is the reliable command form.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Apply `supabase/schema.sql` in the Supabase SQL editor or convert it into a migration.
5. Create individual email/password accounts for Keltech legal users in Supabase Auth.

Without Supabase env vars, the app runs in local demo mode so the multi-page interface, matter editing, calendar, task tracker, document linking, counterparty grouping, and audit flows can be reviewed.

## Audit Log

The production schema creates an append-only `audit_events` table. Database triggers capture create, update, and delete actions for core legal records. The app also records explicit events such as login requests, document access requests, linked document additions, and budget adjustments.

Document uploads should use the private `matter-documents` Storage bucket. Document preview/download flows should call `record_audit_event` before generating or opening signed URLs.

## Production Deployment

Supabase project created for Keltech:

```bash
VITE_SUPABASE_URL=https://jculrwywvuxybnkzhvhg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_zNqMcbKx5b_BaX06N_dBvQ_9j00acYC
```

Vercel settings:

```bash
Build command: npm run build
Output directory: dist
```

Current production deployment:

```bash
https://keltechlegal.vercel.app
```

Before inviting users:

1. Create Keltech legal team users manually in Supabase Auth.
2. Add the two environment variables above to Vercel Production and Preview.
3. Deploy the GitHub repository to Vercel.
4. Set Supabase Auth Site URL to the Vercel production URL.
5. Add the Vercel production URL to Supabase Auth redirect URLs.
6. Smoke test login, matter creation, document upload/access, audit log entries, and realtime updates in two browsers.
