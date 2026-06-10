import { Link, useLocation } from "@tanstack/react-router";

export function StickyBookCTA() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/booking") || pathname.startsWith("/consent") || pathname.startsWith("/payment") || pathname.startsWith("/confirmation")) {
    return null;
  }
  return (
    <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 md:hidden">
      <Link to="/booking" className="btn-luxe">
        BOOK NOW
      </Link>
    </div>
  );
}
