import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/send";
import { formatStudioDate, formatStudioTime } from "@/lib/timezone";

// Scheduled endpoint that sends appointment reminders 24h and 12h before a
// booking. Designed to be hit hourly by a scheduler (Vercel Cron, or any
// external cron service). It is idempotent: each reminder window is claimed in
// the database before sending, and the Resend idempotency key prevents
// duplicate emails even if two runs overlap.
type ReminderWindow = "24h" | "12h";

const WINDOW_COLUMN: Record<ReminderWindow, "reminder_24h_sent_at" | "reminder_12h_sent_at"> = {
  "24h": "reminder_24h_sent_at",
  "12h": "reminder_12h_sent_at",
};

const WINDOW_LABEL: Record<ReminderWindow, string> = {
  "24h": "24 hours",
  "12h": "12 hours",
};

function parseRemaining(notes: string | null, price: number): string | undefined {
  const m = notes?.match(/Remaining \$([0-9]+(?:\.[0-9]{1,2})?)/i);
  if (m) return Number(m[1]).toFixed(2);
  // Fallback: deposit is 35%, so the cash balance is the remaining 65%.
  if (price > 0) return (price - Math.round(price * 0.35 * 100) / 100).toFixed(2);
  return undefined;
}

function parseAddOns(notes: string | null): string | undefined {
  const m = notes?.match(/Add-ons:\s*(.+)\s*$/i);
  return m ? m[1].trim() : undefined;
}

export const Route = createFileRoute("/api/cron/reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // ---- Auth: only an authorized scheduler may trigger this. ----
        const secret = process.env.CRON_SECRET;
        if (!secret) {
          return Response.json(
            { error: "CRON_SECRET is not configured" },
            { status: 500 },
          );
        }
        const authHeader = request.headers.get("authorization") ?? "";
        const url = new URL(request.url);
        const provided =
          authHeader.replace(/^Bearer\s+/i, "").trim() ||
          (url.searchParams.get("secret") ?? "");
        if (provided !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const now = Date.now();
          const nowIso = new Date(now).toISOString();
          // Look a little past 24h so bookings entering the 24h band are caught.
          const horizonIso = new Date(now + 25 * 3_600_000).toISOString();

          const { data: bookings, error } = await supabaseAdmin
            .from("bookings")
            .select(
              "id, customer_name, customer_email, service_name, start_at, end_at, price, notes, status, reminder_24h_sent_at, reminder_12h_sent_at",
            )
            .in("status", ["paid", "confirmed"])
            .gt("start_at", nowIso)
            .lt("start_at", horizonIso);

          if (error) {
            console.error("reminders query failed", error);
            return Response.json({ error: error.message }, { status: 500 });
          }

          const sendReminder = async (
            b: NonNullable<typeof bookings>[number],
            window: ReminderWindow,
          ): Promise<boolean> => {
            const column = WINDOW_COLUMN[window];
            // Atomically claim this window so overlapping runs can't double-send.
            const { data: claimed } = await supabaseAdmin
              .from("bookings")
              .update({ [column]: new Date().toISOString() })
              .eq("id", b.id)
              .is(column, null)
              .select("id")
              .maybeSingle();
            if (!claimed) return false;

            try {
              const start = new Date(b.start_at);
              const durationMin = Math.round(
                (new Date(b.end_at).getTime() - start.getTime()) / 60_000,
              );
              await sendTransactionalEmailServer({
                templateName: "appointment-reminder",
                recipientEmail: b.customer_email,
                idempotencyKey: `reminder-${window}-${b.id}`,
                templateData: {
                  customerName: b.customer_name,
                  serviceName: b.service_name,
                  serviceDuration: durationMin > 0 ? `${durationMin} minutes` : undefined,
                  addOnNames: parseAddOns(b.notes),
                  dateLabel: formatStudioDate(start),
                  timeLabel: formatStudioTime(start),
                  remaining: parseRemaining(b.notes, Number(b.price)),
                  reminderWindow: WINDOW_LABEL[window],
                },
              });
              return true;
            } catch (e) {
              // Roll back the claim so a later run can retry this reminder.
              await supabaseAdmin
                .from("bookings")
                .update({ [column]: null })
                .eq("id", b.id);
              console.error(`reminder ${window} failed for ${b.id}`, e);
              return false;
            }
          };

          let sent24 = 0;
          let sent12 = 0;
          for (const b of bookings ?? []) {
            const hoursUntil = (new Date(b.start_at).getTime() - now) / 3_600_000;
            if (!b.reminder_24h_sent_at && hoursUntil <= 24 && hoursUntil > 12) {
              if (await sendReminder(b, "24h")) sent24++;
            }
            if (!b.reminder_12h_sent_at && hoursUntil <= 12 && hoursUntil > 0) {
              if (await sendReminder(b, "12h")) sent12++;
            }
          }

          return Response.json({
            ok: true,
            considered: bookings?.length ?? 0,
            sent24h: sent24,
            sent12h: sent12,
          });
        } catch (e: any) {
          console.error("reminders error", e);
          return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
        }
      },
    },
  },
});
