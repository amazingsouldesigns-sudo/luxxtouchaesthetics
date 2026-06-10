import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getBooking, clearBooking, type BookingState } from "@/lib/booking-store";
import { getServiceById } from "@/lib/services";
import { computePricing } from "@/lib/pricing";
import { Check, Mail, Loader2 } from "lucide-react";

type Search = { session_id?: string };

export const Route = createFileRoute("/confirmation")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Booking Confirmed — Luxx Touch Aesthetics" },
      { name: "description", content: "Your luxury beauty appointment is confirmed." },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { session_id } = useSearch({ from: "/confirmation" });
  const [b, setB] = useState<BookingState>({});
  const [status, setStatus] = useState<"verifying" | "ok" | "error" | "no-session">(
    session_id ? "verifying" : "no-session",
  );
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    setB(getBooking());
    if (!session_id) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session_id }),
        });
        const json = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(json.error ?? "Verification failed");
        if (!json.paid) {
          setStatus("error");
          setError("Payment not completed.");
          return;
        }
        setMeta(json.metadata ?? null);
        setStatus("ok");
        clearBooking();
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? "Could not verify payment");
        setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [session_id]);

  const service = b.serviceId ? getServiceById(b.serviceId) : undefined;
  const pricing = b.serviceId ? computePricing(b.serviceId, b.addOnIds ?? []) : null;
  const dateStr = b.date
    ? new Date(b.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "—";

  if (status === "verifying") {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[color:var(--ruby)]" />
        <p className="mt-4 text-sm text-muted-foreground">Confirming your payment…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-3xl">We couldn't confirm your payment</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        <Link to="/payment" className="mt-6 inline-block btn-luxe">RETURN TO PAYMENT</Link>
      </div>
    );
  }

  const depositPaid = meta?.deposit ?? pricing?.deposit.toFixed(2) ?? "0.00";
  const remaining = meta?.remaining ?? pricing?.remaining.toFixed(2) ?? "0.00";
  const total = meta?.total ?? pricing?.total.toFixed(2) ?? "0.00";

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[color:var(--ruby)] text-primary-foreground">
        <Check className="h-7 w-7" />
      </div>
      <h1 className="mt-8 font-display text-4xl sm:text-5xl">Thank you for booking with Luxx Touch Aesthetics!</h1>
      <p className="mt-4 text-muted-foreground">
        Your deposit has been received and your appointment is confirmed. A confirmation has been sent to your inbox.
      </p>

      <div className="mt-10 card-luxe ring-luxe p-6 text-left sm:p-8">
        <div className="text-[10px] tracking-luxe text-[color:var(--ruby)]">APPOINTMENT DETAILS</div>
        <div className="mt-3 font-display text-2xl">{service?.name ?? meta?.serviceName ?? "Your service"}</div>
        <div className="mt-1 text-sm text-muted-foreground">{service?.duration}</div>
        {meta?.addOnNames && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Add-ons: </span>
            {meta.addOnNames}
          </div>
        )}
        <div className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
          <Row label="Date" value={dateStr} />
          <Row label="Time" value={b.time ?? "—"} />
          <Row label="Name" value={b.fullName ?? meta?.fullName ?? "—"} />
          <Row label="Email" value={b.email ?? meta?.email ?? "—"} />
        </div>
        <div className="mt-5 space-y-1 border-t border-border pt-5 text-sm">
          <Line label="Total" value={`$${total}`} />
          <Line label="Deposit paid (35%)" value={`$${depositPaid}`} accent />
          <Line label="Remaining (cash at visit)" value={`$${remaining}`} />
        </div>
      </div>

      <p className="mt-6 inline-flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5" /> A confirmation email is on its way.
      </p>

      <div className="mt-10">
        <Link to="/" className="btn-luxe">
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-luxe text-muted-foreground">{label.toUpperCase()}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`text-sm ${accent ? "tracking-luxe text-[color:var(--ruby)]" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span className={accent ? "font-display text-xl text-[color:var(--ruby)]" : "font-display text-base"}>
        {value}
      </span>
    </div>
  );
}
