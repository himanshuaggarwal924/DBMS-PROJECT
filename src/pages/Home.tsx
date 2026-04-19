import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Building2,
  Database,
  MapPin,
  Route,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";
import {
  useGetPopularCities,
  useGetTopRatedPlaces,
  useGetRecommendations,
} from "@workspace/api-client-react";
import CityCard from "@/components/CityCard";
import PlaceCard from "@/components/PlaceCard";
import SearchPreview from "@/components/SearchPreview";
import { trackUserActivity } from "@/lib/imageUtils";
import { useAuth } from "@/lib/useAuthHook";
import heroBg from "@/assets/hero-bg.png";

const STATS = [
  { value: "30+",   label: "Places per city",   icon: <MapPin className="h-5 w-5" /> },
  { value: "⚡ Fast", label: "MySQL cache layer", icon: <Database className="h-5 w-5" /> },
  { value: "3",     label: "Place categories",   icon: <Utensils className="h-5 w-5" /> },
  { value: "∞",     label: "Trip itineraries",   icon: <Route className="h-5 w-5" /> },
];

const FEATURES = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Cache-aside Search",
    desc: "First search hits RapidAPI Travel Advisor. Every repeat search reads instantly from MySQL — no duplicate API calls.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: <Route className="h-6 w-6" />,
    title: "Smart Itinerary Builder",
    desc: "Add places to any trip day, set visit order, and one-click optimise by Haversine distance to minimise travel time.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Budget Dashboard",
    desc: "Log actual expenses per category and watch planned budget vs. real spend update in real-time.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "\"Saved Together\" Recs",
    desc: "Self-join on the Favorites table surfaces places frequently bookmarked alongside what you're viewing.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "Hotels · Restaurants · Attractions",
    desc: "Filter by category, cost range, and minimum rating. Sort by overall rating or proximity to any lat/lng point.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Admin Analytics (CTE-powered)",
    desc: "7-day rolling activity from a recursive CTE, most-saved places, most-searched cities — all in one dashboard.",
    color: "bg-sky-50 text-sky-600",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: popularCities, isLoading: loadingCities } = useGetPopularCities();
  const { data: topPlaces,     isLoading: loadingPlaces  } = useGetTopRatedPlaces({ limit: 4 });
  const { data: recommendations } = useGetRecommendations({});

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackUserActivity("search", 0, "city");
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Beautiful travel destination"
            className="h-full w-full object-cover object-center"
          />
          <div className="hero-overlay absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 text-center">
          <div className="animate-fade-in-up mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            Powered by RapidAPI Travel Advisor + MySQL cache
          </div>

          <h1 className="animate-fade-in-up delay-100 mt-4 text-5xl font-display font-bold leading-tight text-white drop-shadow-lg md:text-7xl">
            Plan Your Perfect<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-300">
              Journey
            </span>
          </h1>

          <p className="animate-fade-in-up delay-200 mx-auto mt-6 max-w-2xl text-lg text-white/85 md:text-xl">
            Search any city — hotels, restaurants, and attractions fetched live then
            cached in MySQL for instant repeat queries.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="animate-fade-in-up delay-300 relative mx-auto mt-10 max-w-2xl"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />
            <div className="glass relative flex items-center rounded-full p-2">
              <div className="pl-4 pr-2 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Where to? Try Goa, Paris, Tokyo…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-3 px-2 text-base text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
            {searchQuery.trim() && <SearchPreview query={searchQuery} />}
          </form>

          {/* Quick links */}
          {!user && (
            <div className="animate-fade-in-up delay-400 mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
            {STATS.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2 py-8 px-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {s.icon}
                </div>
                <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Destinations ──────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
                Destinations
              </p>
              <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-accent" />
                Popular Cities
              </h2>
              <p className="mt-2 text-muted-foreground">
                Most-searched destinations by our community
              </p>
            </div>
            <Link
              href="/search"
              className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingCities ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 skeleton rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popularCities?.slice(0, 4).map((city) => (
                <CityCard
                  key={city.id}
                  city={{ ...city, description: city.description || "", state: city.state || "" }}
                  onView={() => trackUserActivity("view", city.id, "city")}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Top Rated Places ──────────────────────────────────── */}
      <section className="py-20 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Experiences
            </p>
            <h2 className="text-3xl font-display font-bold">Highest Rated Places</h2>
            <p className="mt-2 text-muted-foreground">
              Top-rated hotels, restaurants, and attractions across all cities
            </p>
          </div>

          {loadingPlaces ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 skeleton rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {topPlaces?.slice(0, 4).map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onView={() => trackUserActivity("view", place.id, "place")}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
              What's inside
            </p>
            <h2 className="text-3xl font-display font-bold">
              Everything You Need to Plan Smarter
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              A full-stack system built with React, Express, and MySQL — featuring
              cache-aside search, distance-based sorting, and budget tracking.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-display font-bold text-foreground">{f.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recommendations (logged-in users) ─────────────────── */}
      {recommendations && recommendations.length > 0 && (
        <section className="py-20 bg-secondary/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 flex items-center gap-3 text-3xl font-display font-bold">
              <Sparkles className="h-8 w-8 text-primary" />
              Recommended For You
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {recommendations.slice(0, 4).map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onView={() => trackUserActivity("view", place.id, "place")}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ────────────────────────────────────────── */}
      {!user && (
        <section className="py-20 bg-gradient-to-br from-primary to-blue-700">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-display font-bold text-white md:text-4xl">
              Ready to start planning?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Create an account to save favourites, build day-wise itineraries,
              and track your travel budget in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/search"
                className="rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse without signing in
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
