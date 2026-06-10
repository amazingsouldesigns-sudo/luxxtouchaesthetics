import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { categories, services, serviceImages } from "@/lib/services";
import { setBooking } from "@/lib/booking-store";
import { Tilt3D } from "@/components/Tilt3D";
import { Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Pricing — Luxx Touch Aesthetics" },
      { name: "description", content: "Browse our full menu: lashes, refills, waxing, facials, brows and combo deals." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const navigate = useNavigate();
  const select = (id: string) => {
    setBooking({ serviceId: id });
    navigate({ to: "/booking" });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <header className="text-center">
        
        <h1 className="mt-3 font-display text-5xl sm:text-7xl">
          Services & <span className="italic text-luxe">Pricing</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          Each service is crafted with care, premium products, and meticulous technique.
        </p>
        <hr className="hr-luxe mx-auto mt-8 w-32" />
      </header>

      {/* Category nav */}
      <nav className="sticky top-24 z-20 mt-12">
        <div className="glass mx-auto flex max-w-fit items-center gap-1 overflow-x-auto rounded-full p-1.5">
          {categories.map((c) => (
            <a
              key={c}
              href={`#${c.replace(/\s+/g, "-").toLowerCase()}`}
              className="whitespace-nowrap rounded-full px-4 py-2 text-[10px] tracking-luxe text-foreground/70 transition-colors hover:bg-[color:var(--ruby)] hover:text-[color:var(--petal)]"
            >
              {c.toUpperCase()}
            </a>
          ))}
        </div>
      </nav>

      <div className="mt-16 space-y-20">
        {categories.map((cat) => {
          const items = services.filter((s) => s.category === cat);
          return (
            <section key={cat} id={cat.replace(/\s+/g, "-").toLowerCase()} className="scroll-mt-44">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">{items.length} OFFERINGS</span>
                  <h2 className="mt-1 font-display text-4xl text-[color:var(--puce)] sm:text-5xl">{cat}</h2>
                </div>
                <hr className="hr-luxe hidden flex-1 sm:block" />
              </div>
              {cat === "Refills" && (
                <div className="mb-6 rounded-2xl border border-[color:var(--ruby)]/40 bg-[color:var(--petal)]/40 p-4 text-sm text-[color:var(--puce)]">
                  <span className="text-[10px] tracking-luxe text-[color:var(--ruby)]">PLEASE NOTE</span>
                  <p className="mt-1 text-foreground/80">
                    We do <span className="font-semibold text-[color:var(--ruby)]">not</span> accept foreign refills. Refills are only available on lash sets originally applied at Luxx Touch Aesthetics.
                  </p>
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <Tilt3D key={s.id} max={6} className="card-luxe ring-luxe glow-hover">
                    <article className="flex h-full flex-col overflow-hidden">
                      {serviceImages[s.id] && (
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <img
                            src={serviceImages[s.id]}
                            alt={s.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-7">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-display text-xl text-foreground">{s.name}</h3>
                          <div className="font-display text-2xl text-luxe">${s.price}</div>
                        </div>
                        <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[color:var(--petal)]/50 px-2.5 py-1 text-[10px] tracking-luxe text-[color:var(--puce)]">
                          <Clock className="h-3 w-3" /> {s.duration.toUpperCase()}
                        </div>
                        <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/70">{s.description}</p>
                        <button onClick={() => select(s.id)} className="btn-luxe mt-6 h-11 group">
                          BOOK NOW
                          <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </article>
                  </Tilt3D>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-20 text-center">
        <Link to="/booking" className="btn-luxe">START BOOKING</Link>
      </div>
    </div>
  );
}
