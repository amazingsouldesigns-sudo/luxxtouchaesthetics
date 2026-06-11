-- Adds per-window reminder tracking so the scheduled reminder job can send a
-- 24-hour and a 12-hour reminder for each booking exactly once.
--
-- Safe to run on an existing database (idempotent).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_12h_sent_at timestamptz;

-- Helps the reminder job quickly find upcoming bookings that still need a nudge.
CREATE INDEX IF NOT EXISTS bookings_reminders_idx
  ON public.bookings (start_at)
  WHERE status IN ('paid', 'confirmed');
