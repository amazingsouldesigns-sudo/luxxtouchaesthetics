import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getBooking, setBooking } from "@/lib/booking-store";

export const Route = createFileRoute("/consent")({
  head: () => ({
    meta: [
      { title: "Consent Form & Terms — Luxx Touch Aesthetics" },
      { name: "description", content: "Review and acknowledge the consent form and terms before your appointment." },
    ],
  }),
  component: ConsentPage,
});

function ConsentPage() {
  const navigate = useNavigate();
  const TERMS = [
    { id: "candidacy", label: "I confirm I have reviewed the contraindications above and I am a candidate for my selected service." },
    { id: "waiver", label: "I agree to the consent & waiver, releasing LUXX TOUCH AESTHETICS LLC from liability for the performance of services." },
    { id: "deposit", label: "I understand the deposit is non-refundable and the remaining balance must be paid in CASH ONLY." },
    { id: "lateness", label: "I understand the 10-minute grace period policy and that arriving late may incur a $10 fee or cancellation with loss of deposit." },
    { id: "reschedule", label: "I understand appointments must be cancelled or rescheduled at least 24 hours in advance, and missed appointments require a new deposit." },
  ] as const;
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const toggle = (id: string, v: boolean) => setChecks((c) => ({ ...c, [id]: v }));
  const setAll = (v: boolean) => setChecks(Object.fromEntries(TERMS.map((t) => [t.id, v])));
  const Ack = ({ id }: { id: string }) => (
    <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-[color:var(--blush)]/40 bg-background/60 p-2.5 hover:bg-[color:var(--petal)]/20 transition">
      <input
        type="checkbox"
        checked={!!checks[id]}
        onChange={(e) => toggle(id, e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[color:var(--ruby)]"
      />
      <span className="text-xs text-foreground">{TERMS.find((t) => t.id === id)?.label}</span>
    </label>
  );
  const [hasService, setHasService] = useState(true);
  const agreed = TERMS.every((t) => checks[t.id]);

  useEffect(() => {
    const b = getBooking();
    if (!b.serviceId) setHasService(false);
    if (b.consented) {
      setChecks(Object.fromEntries(TERMS.map((t) => [t.id, true])));
    }
  }, []);

  if (!hasService) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">No booking in progress</h1>
        <p className="mt-3 text-muted-foreground">Please start by selecting a service.</p>
        <Link to="/booking" className="mt-6 btn-luxe">START BOOKING</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
      <header className="text-center">
        <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">STEP 4 OF 5</span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">Consent Form & Terms</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please review the following before continuing.</p>
      </header>

      <div className="mt-10 card-luxe ring-luxe p-6 sm:p-10">
        <div className="max-h-[480px] overflow-y-auto rounded-2xl border border-[color:var(--blush)]/40 bg-gradient-to-br from-[color:var(--petal)]/30 to-background/60 p-6 text-sm leading-relaxed text-foreground/80 backdrop-blur space-y-6">
          <section>
            <h2 className="font-display text-lg text-foreground">Brow Lamination — You are NOT a candidate if:</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>You are pregnant or breastfeeding.</li>
              <li>You have ultra-sensitive skin or eczema on the brows.</li>
              <li>You MUST stop any retinol treatment 3 weeks prior to your appointment.</li>
            </ul>
            <Ack id="candidacy" />
          </section>

          <section>
            <h2 className="font-display text-lg text-foreground">Facials — Contraindications (do not book):</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Contagious skin conditions: active herpes simplex / fungal infections.</li>
              <li>Open wounds, cuts, or sores.</li>
              <li>Use of retinols (isotretinoin, tretinoin) or severe sunburn.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-foreground">Consent &amp; Waiver</h2>
            <p className="mt-2">I agree to disclose any allergies I may have, including but not limited to: latex, sponges, tapes, adhesives, cyanoacrylate, retinols or vitamin A, vitamin C, glycerin, etc.</p>
            <p className="mt-2">I understand it is my responsibility to keep my eyes closed throughout any service until my esthetician tells me otherwise.</p>
            <p className="mt-2">I understand some risks of these services may include, but are not limited to: redness or irritation due to fumes from glue, brow lamination lift or setting lotion, waxing, extractions, etc.</p>
            <p className="mt-2">I agree that by reading and signing this consent form, I release LUXX TOUCH AESTHETICS LLC and its affiliates from any claims, liabilities, demands, damages, actions, or arising actions from the performance of any services.</p>
            <Ack id="waiver" />
          </section>

          <section>
            <h2 className="font-display text-lg text-foreground">Terms &amp; Conditions</h2>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>I understand that the deposit is non-refundable.</li>
              <li>I understand that the remainder of the balance is to be paid in CASH ONLY.</li>
            </ul>
            <Ack id="deposit" />
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li>I understand I am only allowed a 10-minute grace period. If I arrive 6 minutes after the grace period, a $10 late fee is automatically added to my balance. Arriving late without notice or after 16 minutes is subject to immediate cancellation and loss of deposit.</li>
            </ul>
            <Ack id="lateness" />
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li>I understand that if an appointment is missed, it is solely my responsibility, and I must submit a NEW DEPOSIT to schedule another appointment slot.</li>
              <li>Appointments must be cancelled or rescheduled at least 24 hours in advance. Deposits may be transferred once if rescheduling is done within the allowed timeframe.</li>
            </ul>
            <Ack id="reschedule" />
          </section>
        </div>

        <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-[color:var(--ruby)]/40 bg-[color:var(--petal)]/20 p-4 hover:bg-[color:var(--petal)]/30 transition">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAll(e.target.checked)}
            className="h-5 w-5 accent-[color:var(--ruby)]"
          />
          <span className="text-sm font-medium text-foreground">I agree to all of the above</span>
        </label>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <Link to="/booking" className="text-xs tracking-luxe text-muted-foreground">← BACK</Link>
          <button
            disabled={!agreed}
            onClick={() => { setBooking({ consented: true }); navigate({ to: "/payment" }); }}
            className="btn-luxe disabled:cursor-not-allowed disabled:opacity-40"
          >
            CONTINUE TO PAYMENT
          </button>
        </div>
      </div>
    </div>
  );
}
