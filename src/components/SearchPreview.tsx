import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSearchCities, type City } from "@workspace/api-client-react";
import SmartImage from "@/components/SmartImage";
import { getCityImageSources } from "@/lib/imageUtils";

export default function SearchPreview({ query }: { query: string }) {
  const [, setLocation] = useLocation();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: cities = [], isLoading } = useSearchCities(debouncedQuery, { enabled: !!debouncedQuery });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const handleCityClick = (city: City) => {
    setLocation(`/city/${city.id}`);
  };

  if (!query.trim() || (!isLoading && cities.length === 0)) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/50 bg-white shadow-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
          Loading destinations...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.slice(0, 6).map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleCityClick(city)}
              className="group relative h-32 overflow-hidden rounded-xl text-left"
            >
              <SmartImage
                sources={getCityImageSources(city)}
                alt={city.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <h3 className="font-bold">{city.name}</h3>
                <p className="text-xs text-white/70">{city.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
