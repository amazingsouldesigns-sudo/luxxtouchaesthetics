-- ============================================================
-- Luxx Touch Aesthetics — consolidated baseline schema
-- Self-contained setup for a fresh Supabase project.
-- No Lovable Cloud / pgmq / pg_cron / vault dependencies.
-- Email delivery is handled directly by the app via Resend.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'paid', 'cancelled', 'completed');

-- ============================================================
-- updated_at helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- USER_ROLES + has_role()
-- ============================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============================================================
-- Auto-create profile + auto-assign role on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- Auto-grant admin to the owner/operator emails; everyone else is a customer.
  IF lower(NEW.email) IN ('luxxtouch1@gmail.com', 'amazingsoul.designs@gmail.com', 'joelguy26@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Protect admin role on the owner/operator accounts
CREATE OR REPLACE FUNCTION public.protect_admin_roles()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text;
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(OLD.user_id, NEW.user_id);
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_user_id;

  IF v_email IN ('luxxtouch1@gmail.com', 'amazingsoul.designs@gmail.com', 'joelguy26@gmail.com') THEN
    IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
      RAISE EXCEPTION 'Cannot remove admin role from protected account %', v_email;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      RAISE EXCEPTION 'Cannot change admin role on protected account %', v_email;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_admin_roles_trg
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_admin_roles();

-- ============================================================
-- PROFILES policies
-- ============================================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- USER_ROLES policies (admin only writes)
-- ============================================================
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  price numeric(10,2) NOT NULL DEFAULT 0,
  capacity int NOT NULL DEFAULT 1 CHECK (capacity > 0),
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage services" ON public.services
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AVAILABILITY RULES (weekly recurring)
-- ============================================================
CREATE TABLE public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_interval_minutes int NOT NULL DEFAULT 30 CHECK (slot_interval_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rules" ON public.availability_rules
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage rules" ON public.availability_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AVAILABILITY BLACKOUTS
-- ============================================================
CREATE TABLE public.availability_blackouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
ALTER TABLE public.availability_blackouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blackouts" ON public.availability_blackouts
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage blackouts" ON public.availability_blackouts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  service_name text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  cancellation_reason text,
  cancelled_at timestamptz,
  reminder_sent_at timestamptz,
  reminder_24h_sent_at timestamptz,
  reminder_12h_sent_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX bookings_user_id_idx ON public.bookings (user_id);
CREATE INDEX bookings_service_start_idx ON public.bookings (service_id, start_at);
CREATE INDEX bookings_status_start_idx ON public.bookings (status, start_at);

-- Partial unique index — prevents double-booking for capacity-1 services
CREATE UNIQUE INDEX bookings_no_double_book
  ON public.bookings (service_id, start_at)
  WHERE status <> 'cancelled';

CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Snapshot service info + compute end_at on insert
CREATE OR REPLACE FUNCTION public.tg_booking_snapshot()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  s public.services%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.services WHERE id = NEW.service_id;
  IF NOT FOUND OR NOT s.active THEN
    RAISE EXCEPTION 'Service not found or inactive';
  END IF;

  IF NEW.service_name IS NULL OR NEW.service_name = '' THEN
    NEW.service_name := s.name;
  END IF;
  IF NEW.price IS NULL OR NEW.price = 0 THEN
    NEW.price := s.price;
  END IF;
  IF NEW.end_at IS NULL OR NEW.end_at <= NEW.start_at THEN
    NEW.end_at := NEW.start_at + (s.duration_minutes || ' minutes')::interval;
  END IF;

  -- Capacity enforcement for group bookings
  IF s.capacity > 1 THEN
    PERFORM 1 FROM public.bookings
      WHERE service_id = NEW.service_id
        AND status <> 'cancelled'
        AND tstzrange(start_at, end_at, '[)') && tstzrange(NEW.start_at, NEW.end_at, '[)')
      FOR UPDATE;

    IF (SELECT count(*) FROM public.bookings
        WHERE service_id = NEW.service_id
          AND status <> 'cancelled'
          AND tstzrange(start_at, end_at, '[)') && tstzrange(NEW.start_at, NEW.end_at, '[)')
       ) >= s.capacity THEN
      RAISE EXCEPTION 'This time slot is fully booked';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_snapshot_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_booking_snapshot();

-- Cancellation window enforcement
CREATE OR REPLACE FUNCTION public.tg_booking_cancellation_window()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    NEW.cancelled_at := now();
    -- Allow admins to bypass the window
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      IF NEW.start_at - now() < interval '24 hours' THEN
        RAISE EXCEPTION 'Cancellations must be made at least 24 hours in advance. Please contact us directly.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_cancellation_window_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.tg_booking_cancellation_window();

-- ============================================================
-- BOOKINGS POLICIES
-- ============================================================
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

CREATE POLICY "Users can cancel own bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Availability lookups: expose only non-PII slot times via a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_booked_slots(
  _service_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE(start_at timestamptz, end_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT start_at, end_at
  FROM public.bookings
  WHERE service_id = _service_id
    AND status <> 'cancelled'
    AND start_at < _to
    AND end_at > _from;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booked_slots(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, timestamptz, timestamptz) TO anon, authenticated;

-- ============================================================
-- EMAIL SUPPORT TABLES
-- Direct-send model: the app renders + sends via Resend, then
-- records an audit row. Suppression + unsubscribe tokens keep
-- the unsubscribe flow and deliverability hygiene working.
-- ============================================================
CREATE TABLE public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read send log" ON public.email_send_log
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can insert send log" ON public.email_send_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update send log" ON public.email_send_log
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX idx_email_send_log_recipient ON public.email_send_log(recipient_email);
CREATE INDEX idx_email_send_log_message ON public.email_send_log(message_id);

CREATE TABLE public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read suppressed emails" ON public.suppressed_emails
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can insert suppressed emails" ON public.suppressed_emails
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update suppressed emails" ON public.suppressed_emails
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_suppressed_emails_email ON public.suppressed_emails(email);

CREATE TABLE public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- SITE SETTINGS (single-row admin "kill switch" for booking)
-- ============================================================
CREATE TABLE public.site_settings (
  -- Singleton pattern: id is always TRUE so only one row can exist.
  id boolean PRIMARY KEY DEFAULT true,
  bookings_enabled boolean NOT NULL DEFAULT true,
  booking_paused_message text NOT NULL DEFAULT
    'Online booking is temporarily paused. Please check back soon or contact us directly to schedule your appointment.',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id)
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Let logged-in customers view bookings made with their email address
-- (server-created bookings have no user_id).
CREATE POLICY "Users can view bookings by email" ON public.bookings
  FOR SELECT TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email'));

-- ============================================================
-- BLOCKED DATES (admin closes specific calendar days for booking)
-- ============================================================
CREATE TABLE public.blocked_dates (
  day date PRIMARY KEY,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked dates" ON public.blocked_dates
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage blocked dates" ON public.blocked_dates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Lock down internal SECURITY DEFINER functions
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_admin_roles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_booking_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_booking_cancellation_window() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
