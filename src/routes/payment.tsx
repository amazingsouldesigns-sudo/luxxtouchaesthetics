import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getBooking, setBooking } from "@/lib/booking-store";
import { getServiceById, services } from "@/lib/services";
import { computePricing, DEPOSIT_PCT } from "@/lib/pricing";
import { Lock, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Payment — Luxx Touch Aesthetics" },
      { name: "description", content: "Securely confirm and pay your 35% deposit." },
    ],
  }),
  component: PaymentPage,
});

const ADD_ONS = services.filter((s) => s.category === "Add-ons");

function PaymentPage() {
  const navigate = useNavigate();
  const [b, setB] = useState(getBooking());
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = getBooking();
    setB(data);
    setAddOnIds(data.addOnIds ?? []);
  }, []);

  const service = b.serviceId ? getServiceById(b.serviceId) : undefined;
  const pricing = useMemo(
    () => (b.serviceId ? computePricing(b.serviceId, addOnIds, !!b.vip) : null),
    [b.serviceId, addOnIds, b.vip],
  );

  if (!service || !b.consented) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">Booking incomplete</h1>
        <p className="mt-3 text-muted-foreground">Please complete the previous steps first.</p>
        <Link to="/booking" className="mt-6 btn-luxe">START BOOKING</Link>
      </div>
    );
  }

  const toggleAddOn = (id: string) => {
    setAddOnIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setBooking({ addOnIds: next });
      return next;
    });
  };

  const checkout = async () => {
    setError(null);
    setLoading(true);
    try {
      const startAt = b.startAt ?? (b.date ? new Date(b.date).toISOString() : undefined);
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: b.serviceId,
          addOnIds,
          vip: !!b.vip,
          fullName: b.fullName,
          email: b.email,
          phone: b.phone,
          startAt,
          time: b.time,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Could not start checkout");
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setLoading(false);
    }
  };

  const dateStr = b.date
    ? new Date(b.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
      <header className="text-center">
        <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">STEP 5 OF 5</span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Confirm & Pay Deposit</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A 35% non-refundable deposit secures your appointment. The remaining balance is paid in cash at your visit.
        </p>
      </header>

      <div className="mt-10 card-luxe ring-luxe p-6 sm:p-10">
        <div className="rounded-2xl border border-[color:var(--blush)]/40 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <div className="text-[10px] tracking-luxe text-[color:var(--ruby)]">SERVICE</div>
              <div className="mt-1 font-display text-xl">{service.name}</div>
              <div className="text-sm text-muted-foreground">{service.duration}</div>
            </div>
            <div className="font-display text-3xl text-[color:var(--ruby)]">${service.price}</div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Detail label="Date" value={dateStr || "—"} />
            <Detail label="Time" value={b.time || "—"} />
            <Detail label="Name" value={b.fullName || "—"} />
            <Detail label="Email" value={b.email || "—"} />
            <Detail label="Phone" value={b.phone || "—"} />
          </div>
        </div>

        {/* Add-ons */}
        {service.category !== "Add-ons" && ADD_ONS.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl">Enhance your visit</h2>
            <p className="text-xs text-muted-foreground">Optional add-ons — tap to include.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {ADD_ONS.map((a) => {
                const active = addOnIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAddOn(a.id)}
                    className={`flex items-start justify-between rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-[color:var(--ruby)] bg-[color:var(--petal)]/40"
                        : "border-border bg-background/60 hover:border-[color:var(--ruby)]/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base">{a.name}</span>
                        {active && <Check className="h-4 w-4 text-[color:var(--ruby)]" />}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{a.description}</div>
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <span className="font-display text-lg text-[color:var(--ruby)]">+${a.price}</span>
                      {!active && <Plus className="mt-1 h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Pricing breakdown */}
        {pricing && (
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-[color:var(--petal)]/40 to-[color:var(--petal)]/10 p-5">
            <Row label="Service" value={`$${pricing.serviceTotal.toFixed(2)}`} />
            {pricing.addOnsTotal > 0 && (
              <Row label="Add-ons" value={`$${pricing.addOnsTotal.toFixed(2)}`} />
            )}
            {pricing.vipFee > 0 && (
              <Row label="VIP Monday" value={`$${pricing.vipFee.toFixed(2)}`} />
            )}
            <Row label="Total" value={`$${pricing.total.toFixed(2)}`} bold />
            <div className="my-3 border-t border-border" />
            <Row
              label={`Deposit due now (${Math.round(DEPOSIT_PCT * 100)}%)`}
              value={`$${pricing.deposit.toFixed(2)}`}
              accent
            />
            <Row label="Remaining (cash at visit)" value={`$${pricing.remaining.toFixed(2)}`} />
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-[color:var(--ruby)]/40 bg-[color:var(--petal)]/30 px-3 py-2 text-sm text-[color:var(--ruby)]">
            {error}
          </p>
        )}

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Secure checkout — payments processed via Stripe.
        </p>

        <button
          onClick={checkout}
          disabled={loading}
          className="mt-6 btn-luxe w-full disabled:opacity-60"
        >
          {loading
            ? "REDIRECTING..."
            : pricing
            ? `PAY DEPOSIT $${pricing.deposit.toFixed(2)}`
            : "PAY DEPOSIT"}
        </button>

        <Link to="/consent" className="mt-4 block text-center text-xs tracking-luxe text-muted-foreground">← BACK</Link>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-luxe text-muted-foreground">{label.toUpperCase()}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className={`text-sm ${accent ? "tracking-luxe text-[color:var(--ruby)]" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span
        className={`${
          accent ? "font-display text-2xl text-[color:var(--ruby)]" : bold ? "font-display text-lg" : "text-sm"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
