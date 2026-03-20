import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface City {
  id: number;
  name: string;
  country: string;
  imageUrl?: string;
  description?: string;
}

const CITY_IMAGES: Record<string, string> = {
  "goa": "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=400&h=300&fit=crop",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
  "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
  "london": "https://images.unsplash.com/photo-1529154036339-40f5e47b1883?w=400&h=300&fit=crop",
  "tokyo": "https://images.unsplash.com/photo-1540959375944-7049f642e9a4?w=400&h=300&fit=crop",
  "dubai": "https://images.unsplash.com/photo-1512453475868-9f0e4c10e83d?w=400&h=300&fit=crop",
  "bangkok": "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300&fit=crop",
  "singapore": "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop",
  "mumbai": "https://images.unsplash.com/photo-1599661046289-e31897846ca3?w=400&h=300&fit=crop",
  "delhi": "https://images.unsplash.com/photo-1597577459583-839a6f78f3dc?w=400&h=300&fit=crop",
  "bangalore": "https://images.unsplash.com/photo-1466637574326-fda84723e495?w=400&h=300&fit=crop",
  "jaipur": "https://images.unsplash.com/photo-1580822260413-3355e780ae0d?w=400&h=300&fit=crop",
  "agra": "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=300&fit=crop",
  "kolkata": "https://images.unsplash.com/photo-1568180485687-8b9e01099bf8?w=400&h=300&fit=crop",
  "hyderabad": "https://images.unsplash.com/photo-1570459027352-4817c6179d49?w=400&h=300&fit=crop",
  "chandigarh": "https://images.unsplash.com/photo-1569163139394-de4798aa62b3?w=400&h=300&fit=crop",
  "bali": "https://images.unsplash.com/photo-1498711134630-51aef1c3f5b2?w=400&h=300&fit=crop",
  "sydney": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  "amsterdam": "https://images.unsplash.com/photo-1528778104028-098e9c6f9de8?w=400&h=300&fit=crop",
  "rome": "https://images.unsplash.com/photo-1552832928-e6db8f3a3cee?w=400&h=300&fit=crop",
  "barcelona": "https://images.unsplash.com/photo-1562883676-c9f8b2e4f0e1?w=400&h=300&fit=crop"
}

export default function SearchPreview({ query }: { query: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/cities/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        // Use images from API response, fallback to predefined mappings
        const citiesWithImages = data.slice(0, 6).map((city: City) => ({
          ...city,
          imageUrl: city.imageUrl || CITY_IMAGES[city.name.toLowerCase()]
        }));
        
        setCities(citiesWithImages);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchCities, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleCityClick = (city: City) => {
    if (!user) {
      setSelectedCity(city);
      return;
    }
    // If city has an ID (from database), use it; otherwise use city name as query param
    if (city.id && city.id > 0) {
      setLocation(`/city/${city.id}`);
    } else {
      setLocation(`/city?name=${encodeURIComponent(city.name)}`);
    }
  };

  if (!query.trim() || cities.length === 0) {
    return null;
  }

  return (
    <>
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border/50 overflow-hidden z-50">
        {loading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
            Loading destinations...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
            {cities.map(city => (
              <button
                key={city.id}
                onClick={() => handleCityClick(city)}
                className="group relative overflow-hidden rounded-xl h-32 hover:ring-2 hover:ring-primary/30 transition-all"
              >
                <img
                  src={city.imageUrl}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <h3 className="text-white font-bold text-sm">{city.name}</h3>
                  <p className="text-white/70 text-xs">{city.country}</p>
                  {!user && (
                    <div className="mt-1 flex items-center gap-1 text-yellow-300 text-xs font-medium">
                      <Lock className="w-3 h-3" /> Click to explore
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      {selectedCity && !user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="relative h-40 overflow-hidden">
              <img
                src={selectedCity.imageUrl}
                alt={selectedCity.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
              <button
                onClick={() => setSelectedCity(null)}
                className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-2xl font-bold text-white">{selectedCity.name}</h2>
                <p className="text-white/80 text-sm">{selectedCity.country}</p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                {selectedCity.description || "Discover hotels, restaurants, and attractions in this beautiful destination."}
              </p>

              <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Lock className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Sign in to explore this city
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setLocation("/login");
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setLocation("/register");
                  }}
                  className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  Create Account
                </button>
                <button
                  onClick={() => setSelectedCity(null)}
                  className="w-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
