-- Fixes a catalog/database mismatch: the website lists "Cluster Lash Set" but
-- it was never inserted into the services table. Booking it charged the deposit
-- and then failed with "Service not configured in the database" because the
-- booking lookup matches by service name.
--
-- Idempotent: only inserts if a service with that name does not already exist.
INSERT INTO public.services
  (id, name, description, category, duration_minutes, price, capacity, active, sort_order)
SELECT
  'b2e7c1d4-3f8a-4c2b-9e6d-1a2b3c4d5e6f',
  'Cluster Lash Set',
  'Quick-glam cluster lashes for an instant fuller look.',
  'Lashes',
  45,
  35.00,
  1,
  true,
  90
WHERE NOT EXISTS (
  SELECT 1 FROM public.services WHERE name = 'Cluster Lash Set'
);
