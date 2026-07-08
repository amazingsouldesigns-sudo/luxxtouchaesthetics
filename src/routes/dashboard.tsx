import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CalendarX2, Plus, X } from "lucide-react";

type Booking = {
  id: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_at: string;
  end_at: string;
  price: number;
  status: string;
  notes: string | null;
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { session, isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [loadingData, setLoadingData] = useState(true);
  const [bookingsEnabled, setBookingsEnabled] = useState<boolean | null>(null);
  const [pausedMessage, setPausedMessage] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [blockedDays, setBlockedDays] = useState<{ day: string; reason: string | null }[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (!isAdmin) return;
    void load();
    void loadSettings();
    void loadBlockedDays();
  }, [loading, session, isAdmin]);

  const load = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from("bookings")
      .select("id, service_name, customer_name, customer_email, customer_phone, start_at, end_at, price, status, notes")
      .order("start_at", { ascending: false })
      .limit(200);
    setBookings((data ?? []) as Booking[]);
    setLoadingData(false);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("bookings_enabled, booking_paused_message")
      .maybeSingle();
    setBookingsEnabled(data?.bookings_enabled ?? true);
    setPausedMessage(data?.booking_paused_message ?? "");
  };

  const saveSettings = async (next: { bookings_enabled?: boolean; booking_paused_message?: string }) => {
    setSavingSettings(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ ...next })
      .eq("id", true);
    setSavingSettings(false);
    if (error) {
      alert(error.message);
      return;
    }
    if (next.bookings_enabled !== undefined) setBookingsEnabled(next.bookings_enabled);
    if (next.booking_paused_message !== undefined) setPausedMessage(next.booking_paused_message);
  };

  const loadBlockedDays = async () => {
    const { data } = await supabase
      .from("blocked_dates")
      .select("day, reason")
      .gte("day", new Date().toISOString().slice(0, 10))
      .order("day", { ascending: true });
    setBlockedDays((data ?? []) as { day: string; reason: string | null }[]);
  };

  const addBlockedDays = async (days: string[], reason: string) => {
    if (!days.length) return;
    const rows = days.map((day) => ({ day, reason: reason.trim() || null }));
    const { error } = await supabase
      .from("blocked_dates")
      .upsert(rows, { onConflict: "day" });
    if (error) {
      alert(error.message);
      return;
    }
    void loadBlockedDays();
  };

  const removeBlockedDay = async (day: string) => {
    const { error } = await supabase.from("blocked_dates").delete().eq("day", day);
    if (error) {
      alert(error.message);
      return;
    }
    setBlockedDays((prev) => prev.filter((d) => d.day !== day));
  };

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) alert(error.message);
    else void load();
  };

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!session) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-luxe">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {user?.email}.
        </p>
        <button onClick={signOut} className="btn-luxe mt-6 h-11 px-6 text-[10px]">
          SIGN OUT
        </button>
        <Link to="/" className="mt-4 block text-[10px] tracking-luxe text-muted-foreground">
          ← BACK TO HOME
        </Link>
      </div>
    );
  }

  const now = Date.now();
  const filtered = bookings.filter((b) => {
    const t = new Date(b.start_at).getTime();
    if (filter === "upcoming") return t >= now && b.status !== "cancelled";
    if (filter === "past") return t < now;
    return true;
  });

  const stats = {
    upcoming: bookings.filter((b) => new Date(b.start_at).getTime() >= now && b.status !== "cancelled").length,
    revenue: bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + Number(b.price ?? 0), 0),
    total: bookings.length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-luxe">Dashboard</h1>
          <p className="text-xs tracking-luxe text-muted-foreground">{user?.email}</p>
        </div>
        <button onClick={signOut} className="text-xs tracking-luxe text-muted-foreground hover:text-[color:var(--ruby)]">
          SIGN OUT
        </button>
      </div>

      <BookingToggle
        enabled={bookingsEnabled}
        message={pausedMessage}
        saving={savingSettings}
        onToggle={(v) => saveSettings({ bookings_enabled: v })}
        onSaveMessage={(m) => saveSettings({ booking_paused_message: m })}
      />

      <BlockedDays days={blockedDays} onAdd={addBlockedDays} onRemove={removeBlockedDay} />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Upcoming" value={stats.upcoming.toString()} />
        <Stat label="Total Bookings" value={stats.total.toString()} />
        <Stat label="Gross Revenue" value={`$${stats.revenue.toFixed(2)}`} />
      </div>

      <div className="mt-8 flex gap-2">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[10px] tracking-luxe ${
              filter === f
                ? "bg-[color:var(--puce)] text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        {loadingData ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading bookings…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No bookings.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-[10px] tracking-luxe text-muted-foreground">
              <tr>
                <th className="p-3">DATE</th>
                <th className="p-3">SERVICE</th>
                <th className="p-3">CUSTOMER</th>
                <th className="p-3">PRICE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const d = new Date(b.start_at);
                return (
                  <tr key={b.id} className="border-t border-border">
                    <td className="p-3">
                      <div>{d.toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="p-3">{b.service_name}</td>
                    <td className="p-3">
                      <div>{b.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{b.customer_email}</div>
                      <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                    </td>
                    <td className="p-3">${Number(b.price).toFixed(2)}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] tracking-luxe ${
                          b.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="space-x-2 p-3 text-right text-xs">
                      {b.status !== "confirmed" && (
                        <button onClick={() => updateStatus(b.id, "confirmed")} className="text-emerald-700 hover:underline">
                          Confirm
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button onClick={() => updateStatus(b.id, "cancelled")} className="text-rose-700 hover:underline">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BookingToggle({
  enabled,
  message,
  saving,
  onToggle,
  onSaveMessage,
}: {
  enabled: boolean | null;
  message: string;
  saving: boolean;
  onToggle: (v: boolean) => void;
  onSaveMessage: (m: string) => void;
}) {
  const [draft, setDraft] = useState(message);
  useEffect(() => setDraft(message), [message]);

  const on = enabled === true;
  const messageChanged = draft.trim() !== message.trim();

  return (
    <div className="mt-8 glass ring-luxe rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                enabled === null ? "bg-muted-foreground/40" : on ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <h2 className="font-display text-xl text-luxe">Online Booking</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled === null
              ? "Checking status…"
              : on
                ? "Customers can book appointments right now."
                : "Booking is paused — customers can't book online."}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={enabled === null || saving}
          onClick={() => onToggle(!on)}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            on ? "bg-emerald-500" : "bg-muted-foreground/40"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              on ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <label className="text-[10px] tracking-luxe text-muted-foreground">
          MESSAGE SHOWN WHILE BOOKING IS PAUSED
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-background/60 p-3 text-sm focus:border-[color:var(--ruby)] focus:outline-none"
          placeholder="e.g. We're away until Aug 1 — booking reopens then. Text us for urgent requests."
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={!messageChanged || saving}
            onClick={() => onSaveMessage(draft.trim())}
            className="btn-luxe h-9 px-5 text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "SAVING…" : "SAVE MESSAGE"}
          </button>
        </div>
      </div>
    </div>
  );
}

function eachDayInclusive(start: string, end: string): string[] {
  // Iterate in UTC so daylight-saving changes never skip or duplicate a day.
  const out: string[] = [];
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  let guard = 0;
  while (cur <= last && guard < 366) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    guard += 1;
  }
  return out;
}

function BlockedDays({
  days,
  onAdd,
  onRemove,
}: {
  days: { day: string; reason: string | null }[];
  onAdd: (days: string[], reason: string) => void;
  onRemove: (day: string) => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const todayKey = new Date().toISOString().slice(0, 10);

  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // If an end date is set (and valid), block the whole inclusive range.
  const range = start ? eachDayInclusive(start, end && end >= start ? end : start) : [];

  const submit = () => {
    if (!range.length) return;
    onAdd(range, reason);
    setStart("");
    setEnd("");
    setReason("");
  };

  return (
    <div className="mt-6 glass ring-luxe rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <CalendarX2 className="h-5 w-5 text-[color:var(--ruby)]" />
        <h2 className="font-display text-xl text-luxe">Blocked Days</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Close a single day or a range (holidays, vacation). Customers can't book these dates.
        Leave “To” empty to block just one day.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] tracking-luxe text-muted-foreground">FROM</label>
          <input
            type="date"
            min={todayKey}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 h-10 rounded-xl border border-border bg-background/60 px-3 text-sm focus:border-[color:var(--ruby)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] tracking-luxe text-muted-foreground">TO (OPTIONAL)</label>
          <input
            type="date"
            min={start || todayKey}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 h-10 rounded-xl border border-border bg-background/60 px-3 text-sm focus:border-[color:var(--ruby)] focus:outline-none"
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="block text-[10px] tracking-luxe text-muted-foreground">REASON (OPTIONAL)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Vacation"
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm focus:border-[color:var(--ruby)] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!range.length}
          className="btn-luxe inline-flex h-10 items-center px-5 text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="mr-1 h-4 w-4" />
          {range.length > 1 ? `BLOCK ${range.length} DAYS` : "BLOCK DAY"}
        </button>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming days are blocked.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {days.map((d) => (
              <li
                key={d.day}
                className="flex items-center gap-2 rounded-full border border-border bg-background/60 py-1.5 pl-3 pr-1.5 text-sm"
              >
                <span>{fmt(d.day)}</span>
                {d.reason && <span className="text-xs text-muted-foreground">· {d.reason}</span>}
                <button
                  type="button"
                  onClick={() => onRemove(d.day)}
                  aria-label={`Unblock ${d.day}`}
                  className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-rose-100 hover:text-rose-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass ring-luxe rounded-2xl p-5">
      <div className="text-[10px] tracking-luxe text-muted-foreground">{label.toUpperCase()}</div>
      <div className="mt-1 font-display text-2xl text-luxe">{value}</div>
    </div>
  );
}
