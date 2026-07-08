import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { services as servicesCatalog, getServiceById } from "@/lib/services";
import { formatStudioDate, formatStudioTime, studioDateKey } from "@/lib/timezone";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEPOSIT_PCT = 0.35;
const VIP_FEE = 50;

export const Route = createFileRoute("/api/stripe/create-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const {
            serviceId,
            addOnIds = [],
            vip = false,
            fullName,
            email,
            phone,
            startAt,
            time,
          } = body ?? {};

          if (!serviceId || !email || !fullName || !startAt) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const svc = getServiceById(serviceId);
          if (!svc) {
            return new Response(JSON.stringify({ error: "Invalid service" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Admin "kill switch": if online booking is paused, refuse BEFORE
          // charging the customer. Fail open only if the settings row is
          // genuinely unreachable (never block a paying customer over an
          // infra blip) — but a present row that says disabled is honored.
          {
            const { data: settings } = await supabaseAdmin
              .from("site_settings")
              .select("bookings_enabled, booking_paused_message")
              .maybeSingle();
            if (settings && settings.bookings_enabled === false) {
              return new Response(
                JSON.stringify({
                  error:
                    settings.booking_paused_message ||
                    "Online booking is temporarily paused. Please contact us to schedule — you have not been charged.",
                  bookingsPaused: true,
                }),
                { status: 403, headers: { "Content-Type": "application/json" } },
              );
            }
          }

          // Refuse admin-blocked days BEFORE charging.
          {
            const dayKey = studioDateKey(new Date(startAt));
            const { data: blocked } = await supabaseAdmin
              .from("blocked_dates")
              .select("day")
              .eq("day", dayKey)
              .maybeSingle();
            if (blocked) {
              return new Response(
                JSON.stringify({
                  error:
                    "That day is no longer available for booking. Please choose another date — you have not been charged.",
                  dateBlocked: true,
                }),
                { status: 403, headers: { "Content-Type": "application/json" } },
              );
            }
          }

          // Critical: confirm the service exists in the database BEFORE charging.
          // The booking is later recorded against this row; if it's missing we
          // must not take the customer's money and then fail to book them.
          const { data: dbSvc, error: dbSvcErr } = await supabaseAdmin
            .from("services")
            .select("id")
            .eq("name", svc.name)
            .eq("active", true)
            .maybeSingle();
          if (dbSvcErr || !dbSvc) {
            console.error("create-checkout: service not configured in DB", {
              serviceId,
              name: svc.name,
              dbSvcErr,
            });
            return new Response(
              JSON.stringify({
                error:
                  "This service can't be booked online right now. Please contact us and we'll book you in — you have not been charged.",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const addOns = (addOnIds as string[])
            .map((id) => servicesCatalog.find((s) => s.id === id && s.category === "Add-ons"))
            .filter(Boolean) as { id: string; name: string; price: number }[];

          const vipFee = vip ? VIP_FEE : 0;
          const total = svc.price + addOns.reduce((s, a) => s + a.price, 0) + vipFee;
          const depositCents = Math.round(total * DEPOSIT_PCT * 100);
          const remaining = (total - depositCents / 100).toFixed(2);

          // Studio-local labels for the receipt. We trust the customer's chosen
          // time label, but always derive the date label from the canonical UTC
          // instant in the studio timezone so the receipt can never drift.
          const startDate = new Date(startAt);
          const timeLabel = time || formatStudioTime(startDate);
          const dateLabel = formatStudioDate(startDate);

          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-08-27.basil" as any,
          });

          const origin =
            request.headers.get("origin") ||
            `https://${request.headers.get("host")}`;

          const description =
            `35% non-refundable deposit. Remaining $${remaining} due in cash at appointment.` +
            (vip ? ` Includes VIP Monday upgrade (+$${VIP_FEE}).` : "") +
            (addOns.length ? ` Add-ons: ${addOns.map((a) => a.name).join(", ")}.` : "");

          const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: email,
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  unit_amount: depositCents,
                  product_data: {
                    name: `${svc.name} — Deposit (35%)`,
                    description,
                  },
                },
                quantity: 1,
              },
            ],
            payment_intent_data: {
              description: `Deposit for ${svc.name} on ${dateLabel} at ${timeLabel}`,
              metadata: {
                non_refundable: "true",
              },
            },
            metadata: {
              serviceId,
              dbServiceId: dbSvc.id,
              serviceName: svc.name,
              addOnIds: addOns.map((a) => a.id).join(","),
              addOnNames: addOns.map((a) => a.name).join(", "),
              vip: vip ? "true" : "false",
              vipFee: vipFee.toFixed(2),
              fullName,
              email,
              phone: phone ?? "",
              startAt,
              time: timeLabel,
              dateLabel,
              total: total.toFixed(2),
              deposit: (depositCents / 100).toFixed(2),
              remaining,
            },
            success_url: `${origin}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/payment?cancelled=1`,
          });

          return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("create-checkout error", e);
          return new Response(JSON.stringify({ error: e?.message ?? "Server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
