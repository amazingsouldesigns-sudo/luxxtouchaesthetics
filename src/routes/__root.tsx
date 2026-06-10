import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StickyBookCTA } from "@/components/StickyBookCTA";
import { CursorGlow } from "@/components/CursorGlow";
import { Link } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-[color:var(--ruby)]">404</h1>
        <h2 className="mt-4 font-display text-2xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page has slipped away. Let's get you back.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex h-11 items-center bg-[color:var(--puce)] px-6 text-xs tracking-luxe text-primary-foreground">
            GO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Luxx Touch Aesthetics — Luxury Beauty Services" },
      { name: "description", content: "Luxury lashes, waxing, facials and brows. Book your glow at Luxx Touch Aesthetics." },
      { property: "og:title", content: "Luxx Touch Aesthetics — Luxury Beauty Services" },
      { property: "og:description", content: "Luxury lashes, waxing, facials and brows. Book your glow at Luxx Touch Aesthetics." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Luxx Touch Aesthetics — Luxury Beauty Services" },
      { name: "twitter:description", content: "Luxury lashes, waxing, facials and brows. Book your glow at Luxx Touch Aesthetics." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9c57bc6b-7b5b-4df9-8b95-d4a3ba097dd0" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9c57bc6b-7b5b-4df9-8b95-d4a3ba097dd0" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="relative flex min-h-screen flex-col">
        <div className="ambient-glows" aria-hidden />
        <CursorGlow />
        <SiteHeader />
        <main className="relative z-10 flex-1 pt-24">
          <Outlet />
        </main>
        <SiteFooter />
        <StickyBookCTA />
      </div>
    </AuthProvider>
  );
}
