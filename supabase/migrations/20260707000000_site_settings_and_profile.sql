-- ============================================================
-- Adds an admin "kill switch" for online booking + lets logged-in
-- customers see the bookings they made with their email.
--
-- Safe to run on an existing database (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- SITE SETTINGS (single-row table)
-- Lets an admin pause/resume online booking from the dashboard.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  -- Singleton pattern: id is always TRUE so only one row can exist.
  id boolean PRIMARY KEY DEFAULT true,
  bookings_enabled boolean NOT NULL DEFAULT true,
  booking_paused_message text NOT NULL DEFAULT
    'Online booking is temporarily paused. Please check back soon or contact us directly to schedule your appointment.',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read the on/off state so the
-- booking page knows whether to show the wizard.
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admins may change it.
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Admins manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed the single settings row (booking enabled by default).
INSERT INTO public.site_settings (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- CUSTOMER "MY BOOKINGS"
-- Bookings are created by the server (service role) without a user_id,
-- so customers can't see them via the existing user_id policy. This
-- lets a logged-in customer view bookings that were made with the same
-- email address as their account.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view bookings by email" ON public.bookings;
CREATE POLICY "Users can view bookings by email" ON public.bookings
  FOR SELECT TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email'));
