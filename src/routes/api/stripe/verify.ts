import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getServiceById } from "@/lib/services";
import { sendTransactionalEmailServer } from "@/lib/email/send";

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

          // Look up the DB service by name (slugged catalog -> services row)
          const svc = getServiceById(slug);
          if (!svc) return Response.json({ error: "Unknown service" }, { status: 400 });

          const { data: dbSvc, error: svcErr } = await supabaseAdmin
            .from("services")
            .select("id, duration_minutes, price")
            .eq("name", svc.name)
            .eq("active", true)
            .maybeSingle();
          if (svcErr || !dbSvc) {
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
            total: m.total,
            deposit: m.deposit,
            remaining: m.remaining,
          };

          if (existing) {
            return Response.json({ paid: true, bookingId: existing.id, metadata: safeMeta });
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
            const dateLabel = start.toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            });
            const timeLabel = m.time ?? start.toLocaleTimeString("en-US", {
              hour: "numeric", minute: "2-digit",
            });
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
