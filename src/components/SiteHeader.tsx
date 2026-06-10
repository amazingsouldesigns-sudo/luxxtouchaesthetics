import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";


const nav = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/booking", label: "Book" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass ring-luxe flex h-16 items-center justify-between rounded-full px-5 sm:px-7">
          <Link to="/" className="font-display text-lg sm:text-xl text-foreground" aria-label="Luxx Touch Aesthetics">
            Luxx Touch <span className="italic text-luxe">Aesthetics</span>
          </Link>
          <button onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mx-auto mt-2 max-w-6xl px-4">
          <div className="glass rounded-3xl p-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to as any}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm text-foreground/80"
              >
                {n.label}
              </Link>
            ))}
            <Link to="/booking" onClick={() => setOpen(false)} className="btn-luxe mt-2 w-full">
              BOOK NOW
            </Link>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="mt-3 block py-2 text-center text-[10px] tracking-luxe text-muted-foreground hover:text-[color:var(--ruby)]"
            >
              LOGIN
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
