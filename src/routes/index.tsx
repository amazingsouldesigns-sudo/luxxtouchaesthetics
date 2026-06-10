import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { clearBooking } from "@/lib/booking-store";
import heroImg from "@/assets/hero.jpg";
import lashesImg from "@/assets/service-lashes.jpg";
import waxingImg from "@/assets/service-waxing.jpg";
import facialsImg from "@/assets/service-facials.jpg";
import browsImg from "@/assets/service-brows.jpg";
import { Tilt3D } from "@/components/Tilt3D";
import { MapPin, ArrowRight } from "lucide-react";
import luxxLogo from "@/assets/luxx-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Luxx Touch Aesthetics — Luxury Beauty Services | Book Your Glow" },
      { name: "description", content: "Premium lashes, waxing, facials and brows in a luxury setting. Book your appointment today." },
    ],
  }),
  component: Index,
});

const featured = [
  { name: "Lashes", hash: "lashes", img: lashesImg, blurb: "Signature volume, classic & wispy sets." },
  { name: "Waxing", hash: "waxing", img: waxingImg, blurb: "Brazilian, body & face — gentle precision." },
  { name: "Facials", hash: "facials", img: facialsImg, blurb: "Glow, hydra, anti-aging & brightening." },
  { name: "Brows", hash: "brows", img: browsImg, blurb: "Lamination, tint & expert shaping." },
];

const testimonials = [
  { quote: "The most luxurious lash experience I've ever had. Obsessed.", name: "Mia R." },
  { quote: "My skin has never looked better. The Hydra Facial is everything.", name: "Janelle T." },
  { quote: "Clean, calm, professional — and the brows? Perfection.", name: "Sasha K." },
];

function Index() {
  useEffect(() => { clearBooking(); }, []);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Luxury beauty flatlay" className="h-full w-full object-cover scale-110" />
        </div>
        <div className="grain relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-5 py-24 text-[color:var(--petal)]">
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=840+SW+81st+Ave+North+Lauderdale+FL"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-dark absolute right-5 top-6 z-20 inline-flex items-center gap-2 rounded-full px-4 py-1.5 transition-colors hover:text-[color:var(--blush)]"
          >
            <MapPin className="h-3 w-3 text-[color:var(--blush)]" />
            <span className="text-[10px] tracking-luxe">LOCATION</span>
          </a>
          <h1 className="sr-only">Luxx Touch Aesthetics — Luxury Beauty Services</h1>
          {/* Spacer preserves the original hero shape */}
          <div className="mt-6 h-40 sm:h-56 md:h-[8.5rem]" aria-hidden />
          <div className="mt-12 flex flex-wrap gap-4">
            <Link to="/booking" className="btn-luxe is-light btn-glow group">
              BOOK NOW
              <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/services" className="btn-luxe is-light">
              VIEW SERVICES
            </Link>
            <Link to="/booking" search={{ vip: 1 } as never} className="btn-luxe is-ghost" style={{ backgroundColor: "#ff63d9", borderColor: "#ff63d9", color: "#fff" }}>
              VIP MONDAY +$50
            </Link>
          </div>
        </div>
        {/* Logo overlay layer — sized independently of hero layout */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 md:justify-start md:px-0">
          <img
            src={luxxLogo}
            alt="Luxx Touch Aesthetics"
            className="h-[55vh] max-h-[1360px] w-auto max-w-none object-contain drop-shadow-2xl -translate-x-4 sm:h-[80vh] sm:-translate-x-20 md:h-[140vh] md:-translate-x-16"
          />
        </div>
        {/* curve transition */}
        <svg className="absolute bottom-0 left-0 h-12 w-full text-background sm:h-20" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
          <path d="M0,80 C480,0 960,0 1440,80 L1440,80 L0,80 Z" fill="currentColor" />
        </svg>
      </section>

      {/* About */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[color:var(--petal)]/40 via-background to-[color:var(--petal)]/30" />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center sm:py-28">
          <div>
            <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">ABOUT</span>
            <h2 className="mt-3 font-display text-5xl sm:text-6xl">
              A space crafted for <span className="italic text-luxe">your glow</span>.
            </h2>
            <p className="mt-6 text-foreground/80 leading-relaxed">
              At Luxx Touch Aesthetics LLC, we provide luxury beauty services including lash extensions, brow laminations, lash lifts, waxing, and facials. Serving both men and women, we focus on enhancing your natural beauty while delivering a relaxing, high end experience. Our goal is to help every client look and feel their best with quality, personalized care.
            </p>
            <Link to="/services" className="btn-luxe mt-8">DISCOVER MORE</Link>
          </div>
          <div>
            <div className="col-span-2 mb-5 rounded-2xl border border-[color:var(--ruby)]/40 bg-[color:var(--petal)]/40 p-4 text-center sm:p-5">
              <div className="text-[10px] tracking-luxe text-[color:var(--ruby)]">IMPORTANT</div>
              <p className="mt-2 text-sm font-medium text-[color:var(--puce)]">
                Please read all four policies below carefully before booking — they apply to every appointment.
              </p>
            </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Non-Refundable Deposit", body: "A non-refundable deposit is required to secure every appointment." },
              { title: "Cash Remainder", body: "The remaining balance must be paid in cash at your appointment." },
              { title: "10-Minute Grace Period", body: "Arrivals beyond 10 minutes late may need to be rescheduled." },
              { title: "24-Hour Reschedule", body: "Reschedules must be made at least 24 hours before your appointment." },
            ].map((p, i) => (
              <Tilt3D
                key={p.title}
                max={6}
                className={`glass ring-luxe rounded-3xl sm:aspect-[3/4] ${i % 2 === 1 ? "mt-6 sm:mt-10" : ""}`}
              >
                <div className="flex h-full flex-col justify-center p-5 text-center sm:p-6">
                  <div className="text-[10px] tracking-luxe text-[color:var(--ruby)]">POLICY</div>
                  <div className="mt-3 font-display text-2xl text-[color:var(--puce)]">{p.title}</div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </Tilt3D>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">FEATURED</span>
          <h2 className="mt-3 font-display text-5xl sm:text-6xl">
            Signature <span className="italic text-luxe">Services</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">A curated menu of the rituals our clients return for, time and time again.</p>
          <hr className="hr-luxe mt-8 w-32" />
        </div>
        <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((f) => (
            <Tilt3D key={f.name} className="card-luxe ring-luxe overflow-hidden glow-hover">
              <Link to="/services" hash={f.hash} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[calc(var(--radius)-4px)]">
                  <img src={f.img} alt={f.name} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[color:var(--puce)]/70 via-[color:var(--puce)]/10 to-transparent" />
                </div>
                <div className="p-6 tilt-deep">
                  <div className="font-display text-2xl text-[color:var(--puce)]">{f.name}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{f.blurb}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] tracking-luxe text-[color:var(--ruby)]">
                    EXPLORE <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            </Tilt3D>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="text-center">
          <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">TESTIMONIALS</span>
          <h2 className="mt-3 font-display text-5xl sm:text-6xl">
            Loved by our <span className="italic text-luxe">clients</span>
          </h2>
          <hr className="hr-luxe mx-auto mt-8 w-32" />
        </div>
        <div className="mt-14 grid gap-7 md:grid-cols-3">
          {testimonials.map((t) => (
            <Tilt3D key={t.name} max={5} className="glass ring-luxe rounded-3xl">
              <figure className="p-8">
                <div className="font-display text-3xl text-luxe">"</div>
                <blockquote className="-mt-2 font-display text-xl leading-snug text-foreground">{t.quote}</blockquote>
                <figcaption className="mt-6 text-[10px] tracking-luxe text-[color:var(--ruby)]">— {t.name}</figcaption>
              </figure>
            </Tilt3D>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-20 sm:pb-28">
          <div className="glass-dark grain relative overflow-hidden rounded-[calc(var(--radius)+12px)] p-10 text-center text-[color:var(--petal)] sm:p-16">
            <div className="aurora opacity-40" />
            <div className="relative">
              <h2 className="font-display text-4xl sm:text-6xl">
                Ready to book? <span className="italic">Secure your spot now.</span>
              </h2>
              <Link to="/booking" className="btn-luxe is-light mt-8">BOOK NOW</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
