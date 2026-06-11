import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { categories, services, getServiceById, serviceImages } from "@/lib/services";
import { getBooking, setBooking, VIP_FEE } from "@/lib/booking-store";
import { computePricing, DEPOSIT_PCT } from "@/lib/pricing";
import { studioWallTimeToUtc } from "@/lib/timezone";
import { Check, ChevronLeft, ChevronRight, Clock, Crown, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book an Appointment — Luxx Touch Aesthetics" },
      { name: "description", content: "Select a service, pick a date and time, and reserve your spot." },
    ],
  }),
  component: BookingPage,
});

const STEPS = ["Service", "Review & Add-ons", "Date & Time", "Your Details"] as const;
// Bookings pause from 1:00 PM and resume at 3:30 PM
const TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "3:30 PM", "4:30 PM", "6:00 PM"];
const ADD_ONS = services.filter((s) => s.category === "Add-ons" && s.id !== "vip-upgrade");

function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vip, setVip] = useState(false);

  useEffect(() => {
    // Detect VIP flag from URL (?vip=1) and persist
    const urlVip =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("vip") === "1";
    const b = getBooking();
    if (b.serviceId) setServiceId(b.serviceId);
    if (b.addOnIds) setAddOnIds(b.addOnIds);
    if (b.date) setDate(new Date(b.date));
    if (b.time) setTime(b.time);
    if (b.fullName) setFullName(b.fullName);
    if (b.email) setEmail(b.email);
    if (b.phone) setPhone(b.phone);
    const isVip = urlVip || !!b.vip;
    setVip(isVip);
    if (isVip) setBooking({ vip: true });
    if (b.serviceId) setStep(1);
  }, []);

  const service = serviceId ? getServiceById(serviceId) : undefined;

  const canNext =
    (step === 0 && !!serviceId) ||
    step === 1 ||
    (step === 2 && !!date && !!time) ||
    (step === 3 && fullName.trim() && /\S+@\S+\.\S+/.test(email) && phone.trim().length >= 7);

  const next = () => {
    if (step === 0) setBooking({ serviceId });
    if (step === 1) setBooking({ addOnIds });
    if (step === 2) {
      const startAt = date && time ? studioWallTimeToUtc(date, time)?.toISOString() : undefined;
      setBooking({ date: date?.toISOString(), time, startAt });
    }
    if (step === 3) {
      setBooking({ fullName, email, phone });
      navigate({ to: "/consent" });
      return;
    }
    setStep((s) => s + 1);
  };

  const toggleAddOn = (id: string) =>
    setAddOnIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Keyboard navigation: arrow keys move between booking steps.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") {
        if (canNext) { e.preventDefault(); next(); }
      } else if (e.key === "ArrowLeft") {
        if (step > 0) { e.preventDefault(); setStep((s) => Math.max(0, s - 1)); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, canNext, next]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
      <header className="text-center">
        <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">RESERVATION</span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Book Your Appointment</h1>
        {vip && (
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--ruby)]/40 bg-[color:var(--petal)]/40 px-4 py-1.5">
            <Crown className="h-3.5 w-3.5 text-[color:var(--ruby)]" />
            <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">
              VIP MONDAY UNLOCKED · +${VIP_FEE}
            </span>
            <button
              type="button"
              onClick={() => { setVip(false); setBooking({ vip: false }); }}
              className="ml-2 text-[10px] tracking-luxe text-muted-foreground underline-offset-2 hover:underline"
            >
              REMOVE
            </button>
          </div>
        )}
      </header>

      {/* Stepper */}
      <ol className="mt-10 flex items-center justify-center gap-3 sm:gap-6">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center text-xs ${
                i <= step ? "bg-[color:var(--puce)] text-primary-foreground" : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`hidden text-[10px] tracking-luxe sm:inline ${i === step ? "text-[color:var(--ruby)]" : "text-muted-foreground"}`}>
              {label.toUpperCase()}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border sm:w-12" />}
          </li>
        ))}
      </ol>

      <div className="mt-12 card-luxe ring-luxe p-6 sm:p-10">
        {step === 0 && <StepService selected={serviceId} onSelect={setServiceId} />}
        {step === 1 && service && (
          <StepReview service={service} addOnIds={addOnIds} toggleAddOn={toggleAddOn} vip={vip} />
        )}
        {step === 2 && <StepDateTime date={date} time={time} onDate={setDate} onTime={setTime} vip={vip} onEnableVip={() => { setVip(true); setBooking({ vip: true }); }} />}
        {step === 3 && (
          <StepDetails
            service={service}
            date={date}
            time={time}
            addOnIds={addOnIds}
            fullName={fullName}
            email={email}
            phone={phone}
            setFullName={setFullName}
            setEmail={setEmail}
            setPhone={setPhone}
          />
        )}

        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 text-xs tracking-luxe text-muted-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> BACK
          </button>
          <button
            onClick={next}
            disabled={!canNext}
            className="btn-luxe disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === STEPS.length - 1 ? "CONTINUE" : "NEXT"} <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepService({ selected, onSelect }: { selected?: string; onSelect: (id: string) => void }) {
  const bookable = categories.filter((c) => c !== "Add-ons");
  const [cat, setCat] = useState<(typeof categories)[number]>("Lashes");
  const items = useMemo(() => services.filter((s) => s.category === cat), [cat]);
  return (
    <div>
      <h2 className="font-display text-2xl">Select a service</h2>
      <div className="mt-5 -mx-1 flex flex-wrap gap-2">
        {bookable.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-4 py-2 text-[10px] tracking-luxe transition-colors ${
              cat === c ? "bg-gradient-to-r from-[color:var(--puce)] to-[color:var(--ruby)] text-primary-foreground shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--ruby)_60%,transparent)]" : "border border-border bg-background/60 text-foreground/70 hover:border-[color:var(--ruby)]"
            }`}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="mt-6 grid max-h-[480px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {items.map((s) => {
          const active = selected === s.id;
          const img = serviceImages[s.id];
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`flex flex-col items-stretch overflow-hidden rounded-2xl text-left transition-all ${
                active ? "border border-[color:var(--ruby)] bg-[color:var(--petal)]/40 shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--ruby)_40%,transparent)]" : "border border-border bg-background/60 hover:-translate-y-0.5 hover:border-[color:var(--ruby)]/50 hover:shadow-[0_10px_24px_-12px_color-mix(in_oklab,var(--ruby)_25%,transparent)]"
              }`}
            >
              {img && (
                <div className="aspect-[4/3] w-full overflow-hidden bg-[color:var(--petal)]/30">
                  <img src={img} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex flex-col p-5">
                <div className="flex w-full items-baseline justify-between">
                  <span className="font-display text-lg">{s.name}</span>
                  <span className="font-display text-lg text-[color:var(--ruby)]">${s.price}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {s.duration}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({
  service,
  addOnIds,
  toggleAddOn,
  vip,
}: {
  service: NonNullable<ReturnType<typeof getServiceById>>;
  addOnIds: string[];
  toggleAddOn: (id: string) => void;
  vip: boolean;
}) {
  const pricing = computePricing(service.id, addOnIds, vip);
  return (
    <div>
      <h2 className="font-display text-2xl">Your selection</h2>
      <p className="mt-1 text-sm text-muted-foreground">Review your service and personalize with optional add-ons.</p>

      {/* Selected service card */}
      <div className="mt-6 rounded-2xl border border-[color:var(--ruby)] bg-[color:var(--petal)]/40 p-6 shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--ruby)_40%,transparent)]">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] tracking-luxe text-[color:var(--ruby)]">SELECTED SERVICE</div>
            <h3 className="mt-1 font-display text-2xl">{service.name}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {service.duration} • {service.category}
            </div>
          </div>
          <div className="font-display text-3xl text-[color:var(--ruby)]">${service.price}</div>
        </div>
        <p className="mt-3 text-sm text-foreground/75">{service.description}</p>
      </div>

      {/* Add-ons */}
      {ADD_ONS.length > 0 && (
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl">Enhance your visit</h3>
            <span className="text-[10px] tracking-luxe text-muted-foreground">OPTIONAL</span>
          </div>
          <p className="text-xs text-muted-foreground">Tap to include any add-ons.</p>
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

      {/* Mini pricing */}
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-[color:var(--petal)]/40 to-[color:var(--petal)]/10 p-5">
        <Row label="Service" value={`$${pricing.serviceTotal.toFixed(2)}`} />
        {pricing.addOnsTotal > 0 && <Row label="Add-ons" value={`$${pricing.addOnsTotal.toFixed(2)}`} />}
        {pricing.vipFee > 0 && <Row label="VIP Monday" value={`$${pricing.vipFee.toFixed(2)}`} />}
        <Row label="Total" value={`$${pricing.total.toFixed(2)}`} bold />
        <div className="my-3 border-t border-border" />
        <Row label={`Deposit due online (${Math.round(DEPOSIT_PCT * 100)}%)`} value={`$${pricing.deposit.toFixed(2)}`} accent />
        <Row label="Cash at appointment" value={`$${pricing.remaining.toFixed(2)}`} />
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className={`text-sm ${accent ? "tracking-luxe text-[color:var(--ruby)]" : "text-muted-foreground"}`}>{label}</span>
      <span className={`${accent ? "font-display text-2xl text-[color:var(--ruby)]" : bold ? "font-display text-lg" : "text-sm"}`}>
        {value}
      </span>
    </div>
  );
}

function StepDateTime({ date, time, onDate, onTime, vip, onEnableVip }: { date?: Date; time?: string; onDate: (d: Date) => void; onTime: (t: string) => void; vip: boolean; onEnableVip: () => void }) {
  const [view, setView] = useState(() => {
    const d = date ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [pendingMonday, setPendingMonday] = useState<Date | null>(null);
  const today = new Date(); today.setHours(0,0,0,0);

  const monthName = view.toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstDay = view.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl">Pick a date</h2>
        <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="p-1"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-xs tracking-luxe text-[color:var(--ruby)]">{monthName.toUpperCase()}</div>
            <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="p-1"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] tracking-luxe text-muted-foreground">
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if (!c) return <div key={i} />;
              const day = c.getDay();
              const isPast = c < today;
              const needsVip = day === 1 && !vip;
              const disabled = isPast || day === 0;
              const isSelected = date && c.toDateString() === date.toDateString();
              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => {
                    if (needsVip) { setPendingMonday(c); return; }
                    onDate(c);
                  }}
                  className={`aspect-square text-sm transition-colors ${
                    isSelected ? "bg-[color:var(--ruby)] text-primary-foreground"
                    : disabled ? "text-muted-foreground/40 cursor-not-allowed"
                    : needsVip ? "text-[color:var(--ruby)]/70 hover:bg-[color:var(--petal)]/50"
                    : "hover:bg-[color:var(--petal)]/50"
                  }`}
                >{c.getDate()}</button>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-display text-2xl">Pick a time</h2>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
          {TIMES.map((t) => (
            <button
              key={t}
              disabled={!date}
              onClick={() => onTime(t)}
              className={`rounded-full px-3 py-3 text-sm transition-all ${
                time === t ? "bg-gradient-to-br from-[color:var(--puce)] to-[color:var(--ruby)] text-primary-foreground shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--ruby)_60%,transparent)]"
                : !date ? "border border-border text-muted-foreground/40 cursor-not-allowed"
                : "border border-border bg-background/60 hover:-translate-y-0.5 hover:border-[color:var(--ruby)]"
              }`}
            >{t}</button>
          ))}
        </div>
        {!date && <p className="mt-3 text-xs text-muted-foreground">Select a date first.</p>}
      </div>

      <AlertDialog open={!!pendingMonday} onOpenChange={(o) => { if (!o) setPendingMonday(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>VIP Monday Required</AlertDialogTitle>
            <AlertDialogDescription>
              Mondays are reserved exclusively for VIP clients. Add the VIP Upgrade (+${VIP_FEE}) to unlock this date?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingMonday) { onEnableVip(); onDate(pendingMonday); }
                setPendingMonday(null);
              }}
              style={{ backgroundColor: "#ff63d9", color: "#fff" }}
            >
              Add VIP Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StepDetails({ service, date, time, addOnIds, fullName, email, phone, setFullName, setEmail, setPhone }: any) {
  const pricing = service ? computePricing(service.id, addOnIds) : null;
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_280px]">
      <div>
        <h2 className="font-display text-2xl">Your details</h2>
        <div className="mt-6 space-y-5">
          <Field label="Full Name *" value={fullName} onChange={setFullName} placeholder="Jane Doe" />
          <Field label="Email * (required for booking confirmation)" type="email" value={email} onChange={setEmail} placeholder="jane@email.com" />
          <Field label="Phone Number *" type="tel" value={phone} onChange={setPhone} placeholder="(555) 123-4567" />
        </div>
      </div>
      <aside className="rounded-2xl bg-gradient-to-br from-[color:var(--petal)]/60 to-[color:var(--petal)]/20 p-6 ring-1 ring-[color:var(--blush)]/30">
        <div className="text-[10px] tracking-luxe text-[color:var(--ruby)]">SUMMARY</div>
        <div className="mt-3 font-display text-xl">{service?.name ?? "—"}</div>
        <div className="mt-1 text-sm text-muted-foreground">{service?.duration}</div>
        {pricing && pricing.addOnsTotal > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">+ {addOnIds.length} add-on{addOnIds.length > 1 ? "s" : ""}</div>
        )}
        <div className="mt-4 border-t border-border pt-4 text-sm">
          {date ? date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "—"}
          <br />{time ?? "—"}
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-xs tracking-luxe text-muted-foreground">TOTAL</span>
          <span className="font-display text-2xl text-[color:var(--ruby)]">${pricing?.total.toFixed(2) ?? service?.price ?? 0}</span>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-luxe text-muted-foreground">{label.toUpperCase()}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block h-12 w-full rounded-2xl border border-border bg-background/60 px-4 text-sm backdrop-blur transition-colors focus:border-[color:var(--ruby)] focus:bg-background focus:outline-none focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--blush)_30%,transparent)]"
      />
    </label>
  );
}
