import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getServiceById } from "@/lib/services";
import { sendTransactionalEmailServer } from "@/lib/email/send";
import { formatStudioDate, formatStudioTime, studioLocalInfo } from "@/lib/timezone";

export const Route = createFileRoute("/api/stripe/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { sessionId } = await request.json();
          if (!sessionId) {
            return Response.json({ error: "Missing sessionId" }, { status: 400 });
          }

          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-08-27.basil" as any,
          });

          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session.payment_status !== "paid") {
            return Response.json(
              { paid: false, status: session.payment_status },
              { status: 200 },
            );
          }

          const m = session.metadata ?? {};
          const slug = m.serviceId;
          const startAt = m.startAt;
          if (!slug || !startAt) {
            return Response.json({ error: "Missing booking metadata" }, { status: 400 });
          }

          const svc = getServiceById(slug);
          if (!svc) return Response.json({ error: "Unknown service" }, { status: 400 });

          // Resolve the DB service. Prefer the stable id captured at checkout
          // time; fall back to a name match for any sessions created before that
          // id was stored. We track DB errors separately from a genuinely
          // missing row so we can tell the customer the right thing — e.g. if
          // the database is paused/unreachable, that is NOT "service missing".
          let dbSvc: { id: string; duration_minutes: number; price: number } | null = null;
          let dbError: unknown = null;
          if (m.dbServiceId) {
            const { data, error } = await supabaseAdmin
              .from("services")
              .select("id, duration_minutes, price")
              .eq("id", m.dbServiceId)
              .maybeSingle();
            dbSvc = data;
            if (error) dbError = error;
          }
          if (!dbSvc) {
            const { data, error } = await supabaseAdmin
              .from("services")
              .select("id, duration_minutes, price")
              .eq("name", svc.name)
              .eq("active", true)
              .maybeSingle();
            dbSvc = data;
            if (error) dbError = error;
          }
          if (dbError) {
            // The payment succeeded but we couldn't reach the database (e.g. the
            // Supabase project is paused). Do NOT claim the service is missing —
            // tell the customer their payment is safe and we'll confirm shortly,
            // and return 503 so the confirmation page can retry later.
            console.error("verify: database unreachable AFTER payment", {
              sessionId,
              slug,
              name: svc.name,
              dbError,
            });
            return Response.json(
              {
                error:
                  "Your payment was received, but we're having trouble confirming your booking right now. Don't worry — we have your payment and will confirm by email shortly.",
              },
              { status: 503 },
            );
          }
          if (!dbSvc) {
            // Payment already succeeded but the service genuinely isn't in the
            // database — log loudly so the booking can be recovered manually
            // (and refunded if needed). Checkout now prevents this from happening.
            console.error("verify: service not configured AFTER payment", {
              sessionId,
              slug,
              name: svc.name,
              dbServiceId: m.dbServiceId,
            });
            return Response.json({ error: "Service not configured in database" }, { status: 400 });
          }

          const start = new Date(startAt);
          const end = new Date(start.getTime() + dbSvc.duration_minutes * 60_000);

          // Idempotency: check if a booking already exists for this Stripe session
          const { data: existing } = await supabaseAdmin
            .from("bookings")
            .select("id")
            .eq("notes", `stripe:${sessionId}`)
            .maybeSingle();

          // Strip PII (fullName, email, phone) from the response. The
          // confirmation UI reads personal fields from the client-side booking
          // store; only non-sensitive display fields are returned here.
          const safeMeta = {
            serviceName: svc.name,
            addOnNames: m.addOnNames,
            time: m.time,
            dateLabel: m.dateLabel,
            total: m.total,
            deposit: m.deposit,
            remaining: m.remaining,
          };

          if (existing) {
            return Response.json({ paid: true, bookingId: existing.id, metadata: safeMeta });
          }

          // Defense-in-depth: never record a brand-new booking with an invalid
          // time. This only matters for tampering or bugs — the UI already only
          // offers valid slots — but it guarantees no out-of-hours/past booking
          // can slip through. (Existing bookings above are returned untouched.)
          if (start.getTime() <= Date.now()) {
            console.error("verify: rejected past booking time", { sessionId, startAt });
            return Response.json({ error: "Selected time is in the past" }, { status: 400 });
          }
          {
            const { dayOfWeek, minutes } = studioLocalInfo(start);
            const { data: rules } = await supabaseAdmin
              .from("availability_rules")
              .select("start_time, end_time, service_id")
              .eq("day_of_week", dayOfWeek);
            const applicable = (rules ?? []).filter(
              (r) => r.service_id === null || r.service_id === dbSvc.id,
            );
            const within = applicable.some((r) => {
              const [sh, sm] = String(r.start_time).split(":").map(Number);
              const [eh, em] = String(r.end_time).split(":").map(Number);
              return minutes >= sh * 60 + sm && minutes < eh * 60 + em;
            });
            if (!within) {
              console.error("verify: rejected out-of-hours booking", {
                sessionId,
                startAt,
                dayOfWeek,
                minutes,
              });
              return Response.json(
                { error: "Selected time is outside booking hours" },
                { status: 400 },
              );
            }
          }

          const addOnNames = m.addOnNames ? ` | Add-ons: ${m.addOnNames}` : "";
          const notes = `stripe:${sessionId} | Deposit $${m.deposit} paid | Remaining $${m.remaining} cash${addOnNames}`;

          const { data: inserted, error: insErr } = await supabaseAdmin
            .from("bookings")
            .insert({
              service_id: dbSvc.id,
              service_name: svc.name,
              customer_name: m.fullName,
              customer_email: m.email,
              customer_phone: m.phone ?? "",
              start_at: start.toISOString(),
              end_at: end.toISOString(),
              price: Number(m.total),
              status: "paid",
              notes,
            })
            .select("id")
            .single();

          if (insErr) {
            console.error("booking insert error", insErr);
            return Response.json({ error: insErr.message }, { status: 500 });
          }

          // Send invoice-style booking receipt email (non-blocking on failure)
          try {
            const dateLabel = m.dateLabel || formatStudioDate(start);
            const timeLabel = m.time || formatStudioTime(start);
            const ref = `LX-${inserted.id.slice(0, 8).toUpperCase()}`;
            const templateData = {
              customerName: m.fullName,
              serviceName: svc.name,
              serviceDuration: `${dbSvc.duration_minutes} minutes`,
              addOnNames: m.addOnNames || undefined,
              dateLabel,
              timeLabel,
              total: m.total,
              deposit: m.deposit,
              remaining: m.remaining,
              referenceNumber: ref,
            };
            // Customer receipt
            await sendTransactionalEmailServer({
              templateName: "booking-receipt",
              recipientEmail: m.email,
              idempotencyKey: `booking-receipt-${inserted.id}`,
              templateData,
            });
            // Owner notification — same receipt sent to the studio owner
            const ownerEmail = process.env.OWNER_EMAIL || "luxxtouch1@gmail.com";
            await sendTransactionalEmailServer({
              templateName: "booking-receipt",
              recipientEmail: ownerEmail,
              idempotencyKey: `booking-receipt-owner-${inserted.id}`,
              templateData,
            });
          } catch (emailErr) {
            console.error("booking receipt email failed", emailErr);
          }

          return Response.json({ paid: true, bookingId: inserted.id, metadata: safeMeta });
        } catch (e: any) {
          console.error("verify error", e);
          return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
        }
      },
    },
  },
});
