# Deployment & Migration Guide

Target architecture (fully off Lovable):

```txt
GitHub  ->  Vercel (hosting + TanStack Start server routes)
            Supabase (your own project: Postgres + Auth)
            Stripe (payments)
            Resend (transactional emails)
```

This app uses TanStack Start server routes (Stripe checkout/verify, unsubscribe), so it must run on an SSR/serverless host like Vercel. GitHub Pages cannot run it.

---

## 1. Supabase (your own project)

1. Create a new project at https://supabase.com.
2. Apply the schema and seed data. Two options:

   **Option A — Supabase CLI (recommended):**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push          # applies supabase/migrations/20260610000000_init.sql
   # then run the seed once:
   psql "YOUR_DB_CONNECTION_STRING" -f supabase/seed.sql
   ```

   **Option B — SQL Editor (no CLI):**
   - Paste the contents of `supabase/migrations/20260610000000_init.sql` and run it.
   - Paste the contents of `supabase/migrations/20260611000000_booking_reminders.sql` and run it.
   - Paste the contents of `supabase/seed.sql` and run it.

   > If your database was created from an earlier version of `init.sql` (before the reminder columns existed), run the `20260611000000_booking_reminders.sql` migration on it to add the `reminder_24h_sent_at` / `reminder_12h_sent_at` columns. It is safe to re-run.

3. Recreate the two user accounts (creates profiles + roles automatically):
   ```bash
   # PowerShell
   $env:SUPABASE_URL="https://YOUR_REF.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   node scripts/seed-auth-users.mjs
   ```
   The owner (`luxxtouch1@gmail.com`) is auto-granted the admin role by a DB trigger. Each person sets their password via "Forgot password" on the site.

4. Auth settings (Supabase Dashboard → Authentication):
   - Set the Site URL to your production domain.
   - Add your Vercel domain(s) to Redirect URLs.
   - To keep "Continue with Google" working, configure the Google provider (Authentication → Providers → Google).

5. Get your API keys from Project Settings → API:
   - Project URL, anon/publishable key, and service role key (used in env vars below).

> What was intentionally dropped from the old Lovable DB: the `pgmq` queues, `pg_cron` job, `pg_net`, `vault` secret, and the email-queue RPCs. Email is now sent directly via Resend, so none of that machinery is needed. The old email logs (all failed with `domain_not_verified`) were not migrated.

---

## 2. Resend (email)

1. Create an account at https://resend.com.
2. Add and verify your domain `luxxtouchaesthetics.com` (add the DNS records Resend gives you).
3. Create an API key.
4. Set `EMAIL_FROM` to a verified sender, e.g. `Luxx Touch Aesthetics <noreply@luxxtouchaesthetics.com>`.

Until the domain is verified, you can test using Resend's onboarding sender (`onboarding@resend.dev`) by setting `EMAIL_FROM` to it.

---

## 3. Vercel (hosting)

1. Push this repo to GitHub.
2. Import the repo in Vercel; confirm the Framework Preset is **TanStack Start**.
3. Add the environment variables below (Production + Preview).
4. Deploy.

### Environment variables

```txt
VITE_SUPABASE_URL              # https://YOUR_REF.supabase.co  (build-time)
VITE_SUPABASE_PUBLISHABLE_KEY  # anon/publishable key          (build-time)
SUPABASE_URL                   # https://YOUR_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY       # anon/publishable key
SUPABASE_SERVICE_ROLE_KEY      # service role key (secret)
STRIPE_SECRET_KEY              # sk_live_... (or rk_live_ with Checkout perms)
RESEND_API_KEY                 # re_...
EMAIL_FROM                     # "Luxx Touch Aesthetics <noreply@luxxtouchaesthetics.com>"
OWNER_EMAIL                    # luxxtouch1@gmail.com
SITE_URL                       # https://luxxtouchaesthetics.com
CRON_SECRET                    # long random string; protects /api/cron/reminders
```

`VITE_*` variables are inlined at build time, so they must be set before/at build. The others are read at runtime.

---

## 4. Stripe

- Checkout success/cancel URLs are derived from the request origin, so they follow your Vercel/production domain automatically.
- Use a live secret key for production only. A restricted `rk_live_` key works only if it can create + read Checkout Sessions and PaymentIntents.
- Run one low-value live test booking before opening bookings to customers.

---

## 5. Appointment reminders (scheduled job)

The app sends each customer two reminder emails — one ~24 hours and one ~12 hours
before their appointment — via the endpoint `GET /api/cron/reminders`.

How it works: a scheduler calls that endpoint **hourly**. Each run checks for
bookings entering the 24h or 12h window and emails them **exactly once** (tracked
in the `reminder_24h_sent_at` / `reminder_12h_sent_at` columns). Hourly *checking*
does not mean hourly *emailing* — most runs send nothing. The endpoint is
protected by `CRON_SECRET`, sent as `Authorization: Bearer <CRON_SECRET>`.

Pick the option that matches your Vercel plan:

### Option A — Vercel Pro (built-in cron)
`vercel.json` already defines an hourly cron (`0 * * * *`) pointing at
`/api/cron/reminders`. Vercel automatically attaches the `CRON_SECRET`. Nothing
else to do — just make sure `CRON_SECRET` is set in the project's env vars.

### Option B — Vercel Hobby/free (external scheduler)
Vercel's free plan limits built-in cron to once per day, which is too coarse for
24h/12h reminders. Use a free external scheduler instead — **cron-job.org** is
recommended:

1. Create a free account at https://cron-job.org.
2. **Create cronjob** with:
   - **URL:** `https://luxxtouchaesthetics.com/api/cron/reminders`
   - **Schedule:** **Every hour** (this already means every hour of every day —
     do not also pick "daily"). Minute `0` is fine.
   - **Advanced → Headers:** add `Authorization` = `Bearer <CRON_SECRET>`
     (the exact same value as the Vercel env var).
3. Save, then use "Run now" to test. A healthy response is
   `{"ok":true,"considered":0,"sent24h":0,"sent12h":0}` (a `200` is what matters;
   `401` = secret mismatch, `500` = `CRON_SECRET` not set in Vercel).

> The same `CRON_SECRET` must be identical in Vercel and in the scheduler's
> Authorization header.

---

## Post-migration checklist

- [ ] Schema applied (`init.sql`) and seed loaded (`seed.sql`).
- [ ] Auth users created; owner can log in and reach `/dashboard`.
- [ ] Google sign-in configured (if used).
- [ ] Resend domain verified; `EMAIL_FROM` set.
- [ ] All env vars set in Vercel (including `CRON_SECRET`).
- [ ] Test booking → Stripe deposit → confirmation page → receipt email received by customer + owner.
- [ ] Reminder columns present (`reminder_24h_sent_at` / `reminder_12h_sent_at`).
- [ ] Reminder scheduler configured (Vercel Pro cron, or hourly external scheduler) and a manual "Run now" returns `200 ok`.
