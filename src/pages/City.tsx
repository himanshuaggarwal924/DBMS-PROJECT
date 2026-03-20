import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetCityPlaces, useGetCityPlacesByName } from "@workspace/api-client-react";
import PlaceCard from "@/components/PlaceCard";
import { useAuth } from "@/lib/auth";
import { Filter, MapPin, Lock } from "lucide-react";

export default function City() {
  const params = useParams();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Parse city ID from params (for database cities)
  const cityId = parseInt(params.id || "0");
  
  // Parse city name from query params (for dynamic cities)
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const cityNameFromParams = searchParams.get('name') || '';
  
  // Determine if this is a database city or dynamic city
  const isDbCity = cityId > 0;
  const isDynamicCity = !isDbCity && cityNameFromParams;
  
  const [category, setCategory] = useState<any>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Fetch places based on whether it's a DB city or dynamic city
  const { data: dbPlaces, isLoading: dbLoading } = useGetCityPlaces(cityId, { category, minRating, enabled: isDbCity });
  const { data: dynamicPlaces, isLoading: dynamicLoading } = useGetCityPlacesByName(cityNameFromParams, { category, enabled: isDynamicCity });
  
  const places = isDbCity ? dbPlaces : dynamicPlaces;
  const isLoading = isDbCity ? dbLoading : dynamicLoading;
  
  const cityName = isDbCity 
    ? places?.[0]?.cityName || "Destination"
    : cityNameFromParams || "Destination";

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-8 border border-amber-200 dark:border-amber-800">
            <Lock className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Explore This Destination
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign in to see hotels, restaurants, and attractions in this city.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setLocation("/login")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setLocation("/register")}
                className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => setLocation("/")}
                className="w-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* City Header */}
      <div className="bg-primary/5 border-b border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold mb-2 tracking-wide uppercase text-sm">
              <MapPin className="w-4 h-4" /> Exploring
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">{cityName}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm sticky top-28">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
              <Filter className="w-5 h-5 text-primary" /> Filters
            </h3>
            
            <div className="mb-8">
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Category</h4>
              <div className="space-y-2">
                {['hotel', 'restaurant', 'attraction'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={category === cat}
                      onChange={() => setCategory(cat)}
                      className="w-4 h-4 text-primary focus:ring-primary border-muted-foreground/30"
                    />
                    <span className="capitalize group-hover:text-primary transition-colors">{cat}</span>
                  </label>
                ))}
                <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-border/50">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={category === undefined}
                    onChange={() => setCategory(undefined)}
                    className="w-4 h-4 text-primary focus:ring-primary border-muted-foreground/30"
                  />
                  <span className="text-muted-foreground">All Categories</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Minimum Rating</h4>
              <div className="space-y-2">
                {[4, 3, 2].map(rating => (
                  <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="rating" 
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="w-4 h-4 text-primary focus:ring-primary border-muted-foreground/30"
                    />
                    <span>{rating}+ Stars</span>
                  </label>
                ))}
                <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-border/50">
                  <input 
                    type="radio" 
                    name="rating" 
                    checked={minRating === undefined}
                    onChange={() => setMinRating(undefined)}
                    className="w-4 h-4 text-primary focus:ring-primary border-muted-foreground/30"
                  />
                  <span className="text-muted-foreground">Any Rating</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : !places?.length ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <h3 className="text-xl font-bold">No places found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map(place => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
