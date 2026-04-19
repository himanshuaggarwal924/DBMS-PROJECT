import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Database,
  Filter,
  LocateFixed,
  MapPin,
  SlidersHorizontal,
  Wifi,
} from "lucide-react";
import PlaceCard from "@/components/PlaceCard";
import { useGetCityPlaces } from "@workspace/api-client-react";

export default function City() {
  const params = useParams();
  const cityId = Number.parseInt(params.id || "0", 10);

  const [category, setCategory]   = useState<string>("");
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [minCost,   setMinCost]   = useState<number | undefined>(undefined);
  const [maxCost,   setMaxCost]   = useState<number | undefined>(undefined);
  const [sortBy,    setSortBy]    = useState<"rating" | "distance">("rating");
  const [refLat,    setRefLat]    = useState<string>("");
  const [refLng,    setRefLng]    = useState<string>("");

  const placesQuery = useGetCityPlaces(cityId, {
    category:  category || undefined,
    minRating,
    minCost,
    maxCost,
    sortBy,
    refLat:    refLat ? Number(refLat) : undefined,
    refLng:    refLng ? Number(refLng) : undefined,
    enabled:   !!cityId,
  });

  const city   = placesQuery.data?.city;
  const places = placesQuery.data?.places || [];
  const source = placesQuery.data?.source;

  const handleGeolocate = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setRefLat(pos.coords.latitude.toFixed(6));
      setRefLng(pos.coords.longitude.toFixed(6));
      setSortBy("distance");
    });
  };

  const activeFilters = [category, minRating, minCost, maxCost].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header card */}
        <div className="mb-8 rounded-4xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                href="/search"
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back to search
              </Link>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                City explorer
              </p>
              <h1 className="text-4xl font-display font-bold text-foreground">
                {city?.name ?? "Loading…"}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {city?.country && <span>{city.country}</span>}
                {source && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      source === "rapidapi"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {source === "rapidapi" ? (
                      <><Wifi className="h-3 w-3" /> Live from RapidAPI, now cached</>
                    ) : (
                      <><Database className="h-3 w-3" /> Served from MySQL cache</>
                    )}
                  </span>
                )}
              </p>
            </div>

            {city && (
              <div className="flex shrink-0 gap-4 rounded-3xl bg-secondary/50 p-4 text-sm">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Places</p>
                  <p className="mt-1 text-2xl font-display font-bold text-foreground">{places.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Sort</p>
                  <p className="mt-1 text-lg font-semibold capitalize text-foreground">{sortBy}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Filters</p>
                  <p className={`mt-1 text-lg font-semibold ${activeFilters ? "text-primary" : "text-foreground"}`}>
                    {activeFilters || "None"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[300px_1fr]">

          {/* ── Filters sidebar ── */}
          <aside className="filter-sidebar h-fit">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground">Filters</h2>
                  <p className="text-xs text-muted-foreground">Refine results</p>
                </div>
              </div>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={() => { setCategory(""); setMinRating(undefined); setMinCost(undefined); setMaxCost(undefined); }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Category */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["", "hotel", "restaurant", "attraction"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold capitalize transition-all ${
                        category === cat
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-foreground hover:bg-secondary"
                      }`}
                    >
                      {cat || "All types"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min rating */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Min rating
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[undefined, 3, 3.5, 4, 4.5].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setMinRating(v)}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                        minRating === v
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-foreground hover:bg-secondary"
                      }`}
                    >
                      {v ? `${v}+` : "Any"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost range */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Cost range ($)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={minCost ?? ""}
                    onChange={(e) => setMinCost(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Min"
                    className="rounded-2xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    value={maxCost ?? ""}
                    onChange={(e) => setMaxCost(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Max"
                    className="rounded-2xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Sort by
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["rating", "distance"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSortBy(s)}
                      className={`rounded-2xl border px-3 py-2.5 text-xs font-semibold capitalize transition-all ${
                        sortBy === s
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-foreground hover:bg-secondary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance reference */}
              <div className="rounded-3xl border border-dashed border-border bg-secondary/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <LocateFixed className="h-3.5 w-3.5 text-primary" />
                    Reference point
                  </p>
                  {"geolocation" in navigator && (
                    <button
                      type="button"
                      onClick={handleGeolocate}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Use my location
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={refLat}
                    onChange={(e) => setRefLat(e.target.value)}
                    placeholder="Latitude"
                    className="rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                  <input
                    type="number"
                    step="any"
                    value={refLng}
                    onChange={(e) => setRefLng(e.target.value)}
                    placeholder="Longitude"
                    className="rounded-xl border border-border bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  Set coordinates to sort places by Haversine distance.
                </p>
              </div>
            </div>
          </aside>

          {/* ── Results ── */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">
                  {places.length > 0 ? `${places.length} places` : "Results"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Click a place to view details, save to favorites, or add to a trip.
                </p>
              </div>
            </div>

            {placesQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 skeleton rounded-3xl" />
                ))}
              </div>
            ) : placesQuery.isError ? (
              <div className="rounded-4xl border border-red-200 bg-red-50 p-8 text-red-700">
                <p className="font-semibold">Could not load results.</p>
                <p className="mt-1 text-sm">
                  {placesQuery.error instanceof Error
                    ? placesQuery.error.message
                    : "Server error — check the terminal for details."}
                </p>
                <button
                  type="button"
                  onClick={() => placesQuery.refetch()}
                  className="mt-3 rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : places.length === 0 ? (
              <div className="rounded-4xl border border-dashed border-border bg-card p-12 text-center">
                <Filter className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <h3 className="text-xl font-display font-bold text-foreground">No matching places</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try widening the cost range, lowering the minimum rating, or removing a category filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
