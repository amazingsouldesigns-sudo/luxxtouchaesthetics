// Canonical public site URL for auth email links (signup confirm, password reset).
// Always prefer VITE_SITE_URL so production emails never point at localhost,
// even if someone once signed up from a dev server.
export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://www.luxxtouchaesthetics.com";
}
