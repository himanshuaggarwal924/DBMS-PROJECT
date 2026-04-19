import { Link } from "wouter";
import { Compass, Github, Heart, Mail, MapPin } from "lucide-react";

const NAV_LINKS = [
  { label: "Explore cities",  href: "/search" },
  { label: "My trips",        href: "/trips" },
  { label: "Favorites",       href: "/favorites" },
  { label: "Sign in",         href: "/login" },
  { label: "Create account",  href: "/register" },
];

const TECH_LINKS = [
  { label: "React 19 + Vite",         href: "#" },
  { label: "Node.js + Express",        href: "#" },
  { label: "MySQL 8 (cache-aside)",    href: "#" },
  { label: "RapidAPI Travel Advisor",  href: "#" },
  { label: "Tailwind CSS v4",          href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-white shadow-md">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-display font-bold leading-tight">WanderSync</p>
                <p className="text-[10px] text-white/50 leading-tight">Smart Travel Planner</p>
              </div>
            </Link>
            <p className="mt-3 text-sm leading-7 text-white/60">
              A full-stack travel planning system with cache-aside search, day-wise
              itinerary building, distance optimisation, and budget tracking.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="mailto:support@wandersync.dev"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Destinations"
              >
                <MapPin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Navigation</p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Built with</p>
            <ul className="space-y-2.5">
              {TECH_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Features highlight */}
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">Features</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              {[
                "Cache-aside city search",
                "Haversine distance sort",
                "Day-wise itinerary builder",
                "Budget vs. actual tracker",
                "Saved-together recommendations",
                "Admin analytics (CTE)",
                "JWT role-based auth",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} WanderSync. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-white/40">
            Crafted with <Heart className="h-3 w-3 fill-accent text-accent" /> for beautiful journeys
          </p>
          <div className="flex gap-5 text-xs text-white/40">
            <a href="#" className="transition-colors hover:text-white">Privacy</a>
            <a href="#" className="transition-colors hover:text-white">Terms</a>
            <a href="#" className="transition-colors hover:text-white">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
