import { useSearch } from "wouter";
import { useSearchCities } from "@workspace/api-client-react";
import CityCard from "@/components/CityCard";
import { Search as SearchIcon, Frown } from "lucide-react";

export default function Search() {
  const searchParams = new URLSearchParams(useSearch());
  const q = searchParams.get("q") || "";

  const { data: cities, isLoading } = useSearchCities(q, { enabled: !!q });

  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Search Results for "<span className="text-primary">{q}</span>"
          </h1>
          <p className="text-muted-foreground mt-2">Explore destinations matching your search</p>
        </div>

        {!q ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
            <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-foreground">Start exploring</h2>
            <p className="text-muted-foreground mt-2">Enter a destination to find cities</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : !cities?.length ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
            <Frown className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-foreground">No destinations found</h2>
            <p className="text-muted-foreground mt-2">Try searching for something else like "Goa" or "Paris"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {cities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
