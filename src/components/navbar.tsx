import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Compass,
  Heart,
  LogOut,
  Map,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/useAuthHook";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    setLocation("/");
  };

  const navLink = (href: string, label: string, icon: ReactNode) => (
    <Link
      href={href}
      onClick={() => setMobileOpen(false)}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        location === href
          ? "bg-primary text-white shadow-sm shadow-primary/30"
          : "text-foreground/75 hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/25">
              <Compass className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-base font-display font-bold text-foreground leading-tight">WanderSync</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Smart Travel Planner</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLink("/search", "Explore", <Search className="h-4 w-4" />)}
            {user && navLink("/trips", "My Trips", <Map className="h-4 w-4" />)}
            {user && navLink("/favorites", "Favorites", <Heart className="h-4 w-4" />)}
            {user?.role === "admin" && navLink("/analytics", "Admin", <BarChart3 className="h-4 w-4" />)}
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-sm font-medium text-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-secondary hover:border-border/80"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-foreground/75 transition-colors hover:text-foreground hover:bg-secondary"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-md"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-white text-foreground transition-colors hover:bg-secondary md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="absolute inset-x-0 top-[72px] mx-4 overflow-hidden rounded-3xl border border-border bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-1 p-4">
              {[
                { href: "/search",    label: "Explore",   icon: <Search className="h-4 w-4" /> },
                ...(user ? [
                  { href: "/trips",     label: "My Trips",  icon: <Map className="h-4 w-4" /> },
                  { href: "/favorites", label: "Favorites", icon: <Heart className="h-4 w-4" /> },
                ] : []),
                ...(user?.role === "admin" ? [
                  { href: "/analytics", label: "Admin",     icon: <BarChart3 className="h-4 w-4" /> },
                ] : []),
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                    location === href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {icon}
                  {label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-border p-4">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="max-w-[160px] truncate">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-2xl bg-primary py-3 text-sm font-bold text-white"
                  >
                    Get started — it's free
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-2xl border border-border py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
