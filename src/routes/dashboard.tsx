import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (!isAdmin) return;
    void load();
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass ring-luxe rounded-2xl p-5">
      <div className="text-[10px] tracking-luxe text-muted-foreground">{label.toUpperCase()}</div>
      <div className="mt-1 font-display text-2xl text-luxe">{value}</div>
    </div>
  );
}
