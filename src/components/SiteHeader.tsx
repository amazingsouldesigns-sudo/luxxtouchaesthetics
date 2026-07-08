import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, User, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/booking", label: "Book" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session, isAdmin, signOut, user } = useAuth();
  const close = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass ring-luxe flex h-16 items-center justify-between rounded-full px-5 sm:px-7">
          <Link to="/" className="font-display text-lg sm:text-xl text-foreground" aria-label="Luxx Touch Aesthetics">
            Luxx Touch <span className="italic text-luxe">Aesthetics</span>
          </Link>

          <div className="flex items-center gap-2">
            {session && (
              <Link
                to={isAdmin ? "/dashboard" : "/profile"}
                className="hidden max-w-[140px] truncate rounded-full border border-[color:var(--blush)]/50 bg-[color:var(--petal)]/30 px-3 py-1.5 text-[10px] tracking-luxe text-foreground/80 hover:border-[color:var(--ruby)] sm:inline-block"
                title={user?.email ?? "My account"}
              >
                {user?.email}
              </Link>
            )}
            <button onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="mx-auto mt-2 max-w-6xl px-4">
          <div className="glass rounded-3xl p-4">
            {session ? (
              <div className="mb-3 rounded-2xl border border-[color:var(--ruby)]/30 bg-gradient-to-br from-[color:var(--petal)]/50 to-[color:var(--petal)]/20 p-4">
                <div className="flex items-center gap-2 text-[color:var(--ruby)]">
                  <User className="h-4 w-4" />
                  <span className="text-[10px] tracking-luxe">MY ACCOUNT</span>
                </div>
                <div className="mt-2 truncate text-sm font-medium text-foreground">
                  {user?.email}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  View your bookings and manage your profile.
                </p>

                <Link
                  to="/profile"
                  onClick={close}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-[color:var(--puce)] px-4 py-3 text-sm font-medium text-primary-foreground shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--ruby)_60%,transparent)]"
                >
                  <User className="h-4 w-4" />
                  My Profile &amp; Bookings
                </Link>

                {isAdmin && (
                  <Link
                    to="/dashboard"
                    onClick={close}
                    className="mt-2 flex items-center gap-2 rounded-xl border border-[color:var(--ruby)]/40 bg-background/60 px-4 py-3 text-sm text-foreground transition-colors hover:border-[color:var(--ruby)] hover:bg-[color:var(--petal)]/40"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[color:var(--ruby)]" />
                    Admin Dashboard
                  </Link>
                )}

                <button
                  onClick={() => {
                    close();
                    void signOut();
                  }}
                  className="mt-3 flex w-full items-center gap-2 px-1 py-2 text-[11px] tracking-luxe text-muted-foreground hover:text-[color:var(--ruby)]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  SIGN OUT
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={close}
                className="mb-3 flex items-center gap-3 rounded-2xl border border-[color:var(--ruby)]/30 bg-[color:var(--petal)]/25 p-4 transition-colors hover:border-[color:var(--ruby)]"
              >
                <User className="h-5 w-5 text-[color:var(--ruby)]" />
                <div>
                  <div className="text-sm font-medium text-foreground">Log in / Sign up</div>
                  <div className="text-xs text-muted-foreground">Create an account to view your bookings</div>
                </div>
              </Link>
            )}

            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to as any}
                onClick={close}
                className="block py-3 text-sm text-foreground/80"
              >
                {n.label}
              </Link>
            ))}

            <Link to="/booking" onClick={close} className="btn-luxe mt-2 w-full">
              BOOK NOW
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
