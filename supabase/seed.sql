-- ============================================================
-- Luxx Touch Aesthetics — seed data
-- Migrated from the original Lovable/Supabase export (luxxdatabasefiles).
-- Runs automatically on `supabase db reset`, or apply manually once
-- against a fresh project. Idempotent via ON CONFLICT DO NOTHING.
--
-- NOTE: profiles and user_roles are NOT seeded here because they
-- reference auth.users. Create the auth accounts with
-- `node scripts/seed-auth-users.mjs` — the on_auth_user_created
-- trigger then creates the matching profile + role automatically.
-- ============================================================

-- ------------------------------------------------------------
-- SERVICES (44)
-- ------------------------------------------------------------
INSERT INTO public.services
  (id, name, description, category, duration_minutes, price, capacity, active, sort_order, created_at, updated_at)
VALUES
  ('90113791-a599-409e-ad9a-82f728b70705','Luxx Signature Set','Our signature mega volume set for the ultimate glam.','Lashes',180,165.00,1,true,10,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('c339a299-5c2d-4213-9c2b-c1ce5b18dc03','Wispy Volume Set','Soft, fluttery wisps for a doll-like effect.','Lashes',180,150.00,1,true,20,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('ce3c3183-f467-47fe-9319-c07b28bcab6c','Volume Set','Full volume fans for dramatic density.','Lashes',180,140.00,1,true,30,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('0656237f-7915-43a7-9be9-8050430fd7db','Cat Eye','Lifted outer corners for a sultry feline shape.','Lashes',180,140.00,1,true,40,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('be1d1842-01d7-44cf-a6cd-cdca1ab3f9bf','Free Style','Customized lash styling tailored to your eyes.','Lashes',180,140.00,1,true,50,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('1469a73c-6aa7-47f0-b83d-a17714d073ee','Hybrid Set','A blend of classic and volume for the perfect mix.','Lashes',120,135.00,1,true,60,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('3ca42ccf-72f2-4477-bbca-f5b33ab726fa','Wet Set','Spiked, glossy lash effect — trendy and bold.','Lashes',120,135.00,1,true,70,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('a657080f-99f3-4b2e-9988-31b2ea3afee9','Classic Set','One extension per natural lash for everyday elegance.','Lashes',120,120.00,1,true,80,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('dc9e6c97-2bcd-4948-b34d-70dbcff3683b','Refill','Maintain your lash fullness within 2–3 weeks.','Refills',90,100.00,1,true,100,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('5400fe4a-4486-484c-b416-a37274491c99','Luxx Signature Refill','Refill specifically for the Luxx Signature Set.','Refills',120,125.00,1,true,110,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('902abb5f-86c9-476a-8855-23b9b592702b','Removals','Gentle, safe removal of existing lash extensions.','Add-ons',30,35.00,1,true,200,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('ceef2366-4df2-46a9-99a8-8ce2e1dcbb07','Bottom Lashes','Add definition with bottom lash extensions.','Add-ons',30,30.00,1,true,210,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('e7416a9f-ffa2-477e-83fb-dfa79b51af96','VIP Upgrade','Premium upgrade — extra fullness, added length & care.','Add-ons',30,50.00,1,true,220,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('66f82dbd-be89-432d-9ff7-d8d8af1ff4f8','Luxx Brazilian + Butt','Premium Brazilian wax including full butt strip.','Waxing',50,65.00,1,true,300,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('8749df41-87d6-4d93-8196-55937898f715','Brazilian Wax + Butt','Classic Brazilian wax with butt strip.','Waxing',40,50.00,1,true,310,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('89134def-95aa-4675-826d-267f935b6d1f','Underarm','Smooth underarms in minutes.','Waxing',15,20.00,1,true,320,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('1c976c2a-3202-4e44-80a2-e5176cf762c8','Bikini Line','Clean bikini line shaping.','Waxing',25,20.00,1,true,330,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('1ea73e2a-353a-4e9f-9e8a-89acecd1909f','Half Leg','Knee to ankle smooth finish.','Waxing',30,35.00,1,true,340,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('176352f5-9c50-4345-94ff-69dbe8bc3d11','Full Leg','Full leg wax for silky skin.','Waxing',50,60.00,1,true,350,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('95957638-cf51-41d2-9da8-8a6529e20ed7','Half Arm','Elbow to wrist arm wax.','Waxing',30,20.00,1,true,360,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('5002a02d-c58e-4ab2-b7a3-2960e876847e','Full Arm','Full arm wax for total smoothness.','Waxing',50,40.00,1,true,370,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('2b6d6753-5515-4ea9-9bc1-badf7b92b360','Inner Thighs','Targeted inner thigh wax.','Waxing',15,15.00,1,true,380,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('f4dc8c69-ce9b-4009-aad4-6f440464140c','Stomach Strip','Quick stomach strip clean-up.','Waxing',15,10.00,1,true,390,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('55bd1777-528c-4afb-a196-1018179dd7b7','Chin','Smooth chin wax.','Waxing',15,15.00,1,true,400,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('5fe8d120-8568-410f-809a-b4935e79208b','Lip','Upper lip wax.','Waxing',10,10.00,1,true,410,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('83c55773-7da7-43b7-8d5c-d95201de0b3d','Eyebrow','Brow shape & clean-up wax.','Waxing',15,15.00,1,true,420,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('5a139e30-9f18-4962-8783-f97dd47bc081','Luxx Signature Facial','Our signature glow facial — cleanse, exfoliate, mask, massage.','Facials',60,90.00,1,true,500,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('f7357a63-6f00-4cdd-b5ec-c1ceff085cdc','Express Facial','Quick refresh facial for radiant skin.','Facials',30,50.00,1,true,510,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('e461523f-1142-484d-967a-027f97e2b0c6','Anti-Aging Facial','Targeted treatment for fine lines and firmness.','Facials',60,130.00,1,true,520,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('b57eb639-1257-4559-8f22-3bc7d11cb704','Acne Treatment Facial','Deep cleanse and clarify for breakout-prone skin.','Facials',60,130.00,1,true,530,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('8bc597a4-4a08-4751-88c3-8a5089e9efeb','Brightening Facial','Even out tone and reveal a luminous complexion.','Facials',60,120.00,1,true,540,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('04893cbf-7906-48c4-9153-1504bfa2d8bd','Hydra Facial','Deep hydration with our Hydra system.','Facials',75,115.00,1,true,550,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('680e0196-40ce-4972-87a7-b104690495bb','Vagacial','Soothing intimate area facial — ingrowns & smoothing.','Facials',30,50.00,1,true,560,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('fde06739-3869-4f64-a11a-582b56110410','Back Facial','Deep cleanse and clear the back.','Facials',60,70.00,1,true,570,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('d84ae1f0-1182-4db9-8010-5867ea810173','Brow Lamination + Wax','Sculpted, brushed-up laminated brows.','Brows',30,70.00,1,true,600,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('936b13f1-beb9-4a3b-a14a-7853bbcfc835','Brow Lamination + Wax + Tint','Full brow service with custom tint.','Brows',45,90.00,1,true,610,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('766987a4-0386-432c-87a1-dee31b83be03','Tint','Custom brow tint.','Brows',15,20.00,1,true,620,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('5affac6b-fbfd-4eda-b7c7-c9bcaa82218a','Tint + Wax','Brow shape and tint duo.','Brows',30,35.00,1,true,630,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('d1320005-c07e-44a6-ae5e-2d78f9ef616e','Facial + Full Set','Glow facial paired with a full lash set.','Combo Deals',210,185.00,1,true,700,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('61bfb662-1ecf-49dc-95b1-97e2d7ab8ae7','Full Set + Brow Wax','Lash set with brow shaping.','Combo Deals',195,150.00,1,true,710,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('3713cf8f-40f8-4e94-bbd2-5f0cb9eb4e6b','Full Set + Brow Tint','Lash set with brow tint.','Combo Deals',195,155.00,1,true,720,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('9964cca2-2c0a-4b2f-8dbd-05fd276eaca0','Full Set + Brow Tint + Wax','The complete eye-frame package.','Combo Deals',210,160.00,1,true,730,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('10e850f7-1b03-4e89-8421-ccbd3bf0ecf0','Brazilian Wax + Underarm','Brazilian and underarm bundle.','Combo Deals',40,60.00,1,true,740,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00'),
  ('6f8dca5e-0f91-4440-804f-ecc5dda483c9','Brazilian Wax + Vagacial','Brazilian wax followed by a soothing vagacial.','Combo Deals',60,90.00,1,true,750,'2026-05-02 20:40:12.555286+00','2026-05-02 20:40:12.555286+00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- AVAILABILITY RULES (studio hours; service_id NULL = applies to all)
-- ------------------------------------------------------------
INSERT INTO public.availability_rules
  (id, service_id, day_of_week, start_time, end_time, slot_interval_minutes, created_at)
VALUES
  ('180f4af0-20a3-43ba-9eb1-75e71f54cc20', NULL, 6, '09:00:00', '19:00:00', 30, '2026-05-02 20:40:12.555286+00'),
  ('069db3e5-d99d-4e7c-97a8-922ae3b83208', NULL, 1, '09:00:00', '14:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('272e409e-5dcc-4558-9d25-9c13bc4e4777', NULL, 1, '15:30:00', '19:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('613ee5b5-b73b-4df6-9055-a38db660a355', NULL, 2, '09:00:00', '14:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('2ded9099-89e0-4f09-a76a-5eb6b6d36a81', NULL, 2, '15:30:00', '19:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('4ddf5e65-1105-4a57-8064-2685618c951a', NULL, 3, '09:00:00', '14:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('225b1b91-e6a8-4054-82e8-d6b2a45bf9c0', NULL, 3, '15:30:00', '19:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('e9a47e86-1577-445c-aaf9-0346dce22bda', NULL, 4, '09:00:00', '14:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('ed28faf9-5c0e-4f36-a0e5-704e74b093fb', NULL, 4, '15:30:00', '19:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('35ca2049-dc29-4350-b8a7-8640b91eecc4', NULL, 5, '09:00:00', '14:00:00', 30, '2026-05-04 00:02:48.694383+00'),
  ('e15c7ecb-332a-4696-b882-5b371b3c2ebd', NULL, 5, '15:30:00', '19:00:00', 30, '2026-05-04 00:02:48.694383+00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- BOOKINGS (existing paid bookings)
-- ------------------------------------------------------------
INSERT INTO public.bookings
  (id, user_id, service_id, service_name, customer_name, customer_email, customer_phone, price, start_at, end_at, status, notes, created_at, updated_at)
VALUES
  ('a54fa4c3-530e-4c86-8ecd-85e268a42427', NULL, 'f4dc8c69-ce9b-4009-aad4-6f440464140c', 'Stomach Strip', 'Junior Flemmings', 'junior77flemmings@gmail.com', '3054044585', 10.00, '2026-06-02 13:00:00+00', '2026-06-02 13:15:00+00', 'paid', 'stripe:cs_live_a1b0V6oH8KI0YFfPHzcUAyF81ZfL6Cr0AoQkiEXa9ScTPwl01QF6dfXNmV | Deposit $3.50 paid | Remaining $6.50 cash', '2026-05-31 22:44:28.410486+00', '2026-05-31 22:44:28.410486+00'),
  ('f2288fc3-d538-4b50-864c-c956dd3010ee', NULL, 'f4dc8c69-ce9b-4009-aad4-6f440464140c', 'Stomach Strip', 'Cristal Stephenson', 'cristals100@gmail.com', '8603085214', 10.00, '2026-06-04 16:00:00+00', '2026-06-04 16:15:00+00', 'paid', 'stripe:cs_live_a1a8HZcQWpj2HiAkM5npe8JBo8vem0oZ373OxHGsKfNeF2yoftRgAYYQGv | Deposit $3.50 paid | Remaining $6.50 cash', '2026-06-03 13:51:01.516579+00', '2026-06-03 13:51:01.516579+00')
ON CONFLICT (id) DO NOTHING;
