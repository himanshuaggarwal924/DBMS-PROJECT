import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { AlertCircle, Frown, MapPin, RefreshCw, Search as SearchIcon } from "lucide-react";
import { useSearchCities } from "@workspace/api-client-react";
import CityCard from "@/components/CityCard";
import SearchPreview from "@/components/SearchPreview";

export default function Search() {
  const searchParams = new URLSearchParams(useSearch());
  const [, setLocation] = useLocation();
  const initialQ = searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(initialQ);

  const { data: cities, isLoading, isError, error, refetch } = useSearchCities(initialQ, { enabled: !!initialQ });

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) setLocation(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky search bar */}
      <div className="sticky top-[72px] z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-4">
        <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search any city — Goa, Paris, Tokyo…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              Search
            </button>
          </div>
          {inputValue.trim() && inputValue !== initialQ && (
            <SearchPreview query={inputValue} />
          )}
        </form>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        {initialQ && (
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold md:text-4xl">
              Results for{" "}
              <span className="text-primary">&ldquo;{initialQ}&rdquo;</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isLoading
                ? "Searching — may call RapidAPI if the city isn't cached yet…"
                : cities?.length
                  ? `${cities.length} destination${cities.length !== 1 ? "s" : ""} found`
                  : "No matching destinations found"}
            </p>
          </div>
        )}

        {/* States */}
        {!initialQ ? (
          <div className="rounded-4xl border border-dashed border-border bg-card p-16 text-center">
            <SearchIcon className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
            <h2 className="text-2xl font-display font-bold text-foreground">Start exploring</h2>
            <p className="mt-2 text-muted-foreground">
              Type a destination above and press Search.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 skeleton rounded-3xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-4xl border border-red-200 bg-red-50 p-16 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-red-400" />
            <h2 className="text-2xl font-display font-bold text-red-700">Could not reach the server</h2>
            <p className="mt-2 text-red-600 text-sm">
              {error instanceof Error ? error.message : "Request failed — make sure the backend is running on port 5000."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : !cities?.length ? (
          <div className="rounded-4xl border border-dashed border-border bg-card p-16 text-center">
            <Frown className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
            <h2 className="text-2xl font-display font-bold text-foreground">No destinations found</h2>
            <p className="mt-2 text-muted-foreground">
              Try a different spelling, or search for a major city like{" "}
              <button
                type="button"
                onClick={() => setLocation("/search?q=Goa")}
                className="text-primary font-semibold hover:underline"
              >
                Goa
              </button>{" "}
              or{" "}
              <button
                type="button"
                onClick={() => setLocation("/search?q=Paris")}
                className="text-primary font-semibold hover:underline"
              >
                Paris
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
