import { Link } from "@tanstack/react-router";
import { Instagram, Phone } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-[color:var(--brand)] text-[color:var(--petal)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <div className="font-display text-2xl">Luxx Touch Aesthetics</div>
          <p className="mt-3 text-sm opacity-80">Luxury beauty services. Book your glow.</p>
        </div>
        <div>
          <div className="text-[10px] tracking-luxe opacity-70">EXPLORE</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
            <li><Link to="/booking" className="hover:text-white">Book Now</Link></li>
            <li><Link to="/login" className="hover:text-white opacity-60">Login</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[10px] tracking-luxe opacity-70">CONTACT</div>
          <p className="mt-3 text-sm opacity-80">
            By appointment only<br/>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=luxxtouch1@gmail.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white hover:opacity-100">luxxtouch1@gmail.com</a>
          </p>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=840+SW+81st+Ave+North+Lauderdale+FL+33068"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm underline opacity-80 hover:text-white hover:opacity-100"
          >
            840 SW 81st Ave, North Lauderdale, FL 33068
          </a>
          <a
            href="https://www.instagram.com/luxxtouchaestheticsllc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="mt-4 inline-flex items-center gap-3 text-sm opacity-80 hover:text-white hover:opacity-100"
          >
            <Instagram className="h-7 w-7" />
            Instagram
          </a>
          <Popover>
            <PopoverTrigger
              aria-label="Phone"
              className="mt-3 flex items-center gap-3 text-sm opacity-80 hover:text-white hover:opacity-100"
            >
              <Phone className="h-7 w-7" />
              Phone
            </PopoverTrigger>
            <PopoverContent className="glass ring-luxe w-auto rounded-3xl border-0 p-6 text-center">
              <div className="text-[10px] tracking-luxe text-muted-foreground">CALL US</div>
              <a href="tel:+19546719889" className="btn-luxe mt-3 inline-block">
                +(954)-671-9889
              </a>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs opacity-60">
        © {new Date().getFullYear()} Luxx Touch Aesthetics. All rights reserved.
      </div>
    </footer>
  );
}
