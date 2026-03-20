import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Sparkles, TrendingUp } from "lucide-react";
import { useGetPopularCities, useGetTopRatedPlaces, useGetRecommendations } from "@workspace/api-client-react";
import CityCard from "@/components/CityCard";
import PlaceCard from "@/components/PlaceCard";
import SearchPreview from "@/components/SearchPreview";
import { getSeededImage, trackUserActivity } from "@/lib/imageUtils";
import heroBg from "@/assets/hero-bg.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: popularCities, isLoading: loadingCities } = useGetPopularCities();
  const { data: topPlaces, isLoading: loadingPlaces } = useGetTopRatedPlaces({ limit: 4 });
  const { data: recommendations } = useGetRecommendations({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackUserActivity("search", 0, "city");
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Beautiful destination" 
            loading="lazy"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-background"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center mt-16">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Discover Your Next <br/>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-accent to-yellow-400">Great Adventure</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
            Explore top-rated hotels, highly recommended restaurants, and unforgettable attractions around the world.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full transition-all group-hover:bg-white/30"></div>
            <div className="relative glass rounded-full p-2 flex items-center">
              <div className="pl-4 pr-2 text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Where do you want to go? (e.g., Goa, Paris, Tokyo)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-lg focus:ring-0 text-foreground placeholder:text-muted-foreground py-3 px-2 outline-none w-full"
              />
              <button 
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <Search className="w-5 h-5" /> Search
              </button>
            </div>
            
            {/* Search Preview with Image Results */}
            {searchQuery.trim() && <SearchPreview query={searchQuery} />}
          </form>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                <TrendingUp className="text-accent w-8 h-8" /> Popular Destinations
              </h2>
              <p className="text-muted-foreground mt-2">Most searched cities by our community</p>
            </div>
          </div>
          
          {loadingCities ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCities?.slice(0, 4).map((city, idx) => (
                <CityCard 
                  key={city.id} 
                  city={{
                    ...city, 
                    description: '', 
                    state: '', 
                    imageUrl: getSeededImage(idx, "city"),
                    averageRating: 4.3 + Math.random() * 0.7,
                    reviewCount: Math.floor(Math.random() * 200) + 50
                  }} 
                  onView={() => trackUserActivity("view", city.id, "city")}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Rated Places / Highest Rated Experiences */}
      <section className="py-20 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-display font-bold mb-4">Highest Rated Experiences</h2>
            <p className="text-muted-foreground">Don't miss these top-rated hotels, restaurants, and attractions.</p>
          </div>
          
          {loadingPlaces ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1,2,3,4].map(i => <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse"></div>)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topPlaces?.slice(0, 4).map((place, idx) => (
                <PlaceCard 
                  key={place.id} 
                  place={{
                    ...place,
                    imageUrl: place.imageUrl || getSeededImage(idx, "place")
                  }}
                  onView={() => trackUserActivity("view", place.id, "place")}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold mb-10 flex items-center gap-3">
              <Sparkles className="text-primary w-8 h-8" /> Recommended For You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendations.slice(0, 4).map((place, idx) => (
                <PlaceCard 
                  key={place.id} 
                  place={{
                    ...place,
                    imageUrl: place.imageUrl || getSeededImage(idx, "place")
                  }}
                  onView={() => trackUserActivity("view", place.id, "place")}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
