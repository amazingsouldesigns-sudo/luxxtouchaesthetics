-- ============================================================
-- Lets an admin close specific calendar days for booking (e.g. days
-- off, holidays, vacation). The booking calendar hides these days and
-- the server refuses to charge for them.
--
-- Safe to run on an existing database (idempotent).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.blocked_dates (
  -- The blocked day, as a studio-local calendar date (no time component).
  day date PRIMARY KEY,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Anyone can read blocked days so the public booking calendar can grey
-- them out.
DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admins can add/remove blocked days.
DROP POLICY IF EXISTS "Admins manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Admins manage blocked dates" ON public.blocked_dates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
