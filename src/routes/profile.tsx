import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatStudioDate, formatStudioTime } from "@/lib/timezone";

type Booking = {
  id: string;
  service_name: string;
  start_at: string;
  end_at: string;
  price: number;
  status: string;
};

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "My Bookings — Luxx Touch Aesthetics" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    void load();
  }, [loading, session]);

  const load = async () => {
    setLoadingData(true);
    const { data } = await supabase
      .from("bookings")
      .select("id, service_name, start_at, end_at, price, status")
      .order("start_at", { ascending: false })
      .limit(200);
    setBookings((data ?? []) as Booking[]);
    setLoadingData(false);
  };

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!session) return null;

  const now = Date.now();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const upcoming = active.filter((b) => new Date(b.start_at).getTime() >= now);
  const past = bookings.filter((b) => new Date(b.start_at).getTime() < now || b.status === "cancelled");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">MY ACCOUNT</span>
          <h1 className="mt-2 font-display text-4xl">My Profile</h1>
        </div>
        <button
          onClick={signOut}
          className="text-xs tracking-luxe text-muted-foreground hover:text-[color:var(--ruby)]"
        >
          SIGN OUT
        </button>
      </header>

      <div className="mt-6 rounded-2xl border border-[color:var(--blush)]/40 bg-[color:var(--petal)]/25 p-5">
        <div className="text-[10px] tracking-luxe text-muted-foreground">SIGNED IN AS</div>
        <div className="mt-1 font-display text-xl text-foreground">{user?.email}</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Appointments booked with this email address appear below.
        </p>
      </div>

      {loadingData ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">Loading your appointments…</div>
      ) : bookings.length === 0 ? (
        <div className="mt-12 card-luxe ring-luxe p-10 text-center">
          <h2 className="font-display text-2xl">No bookings yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            When you book an appointment with this email address, it'll show up here.
          </p>
          <Link to="/booking" className="btn-luxe mt-6 inline-flex">
            BOOK AN APPOINTMENT
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <Section title="Upcoming" empty="No upcoming appointments." bookings={upcoming} />
          <Section title="Past & Cancelled" empty="Nothing here yet." bookings={past} muted />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  empty,
  bookings,
  muted,
}: {
  title: string;
  empty: string;
  bookings: Booking[];
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="font-display text-xl text-luxe">{title}</h2>
      {bookings.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((b) => {
            const start = new Date(b.start_at);
            return (
              <li
                key={b.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/60 p-5 ${
                  muted ? "opacity-80" : ""
                }`}
              >
                <div>
                  <div className="font-display text-lg">{b.service_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatStudioDate(start)} · {formatStudioTime(start)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg text-[color:var(--ruby)]">
                    ${Number(b.price).toFixed(2)}
                  </span>
                  <StatusPill status={b.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "confirmed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "cancelled"
        ? "bg-rose-100 text-rose-800"
        : status === "paid"
          ? "bg-sky-100 text-sky-800"
          : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] tracking-luxe ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}
