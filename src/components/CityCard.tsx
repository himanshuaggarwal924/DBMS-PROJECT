import { Link } from "wouter";
import type { City } from "@workspace/api-client-react";
import { ArrowUpRight, Star } from "lucide-react";

interface CityCardProps {
  city: City & { averageRating?: number; reviewCount?: number };
  onView?: () => void;
}

export default function CityCard({ city, onView }: CityCardProps) {
  const handleClick = () => {
    onView?.();
  };

  const rating = city.averageRating || 4.5;
  const reviewCount = city.reviewCount || 0;
  
  // If city has an ID (from database), use it; otherwise use city name as query param
  const href = city.id && city.id > 0
    ? `/city/${city.id}`
    : `/city?name=${encodeURIComponent(city.name)}`;

  return (
    <Link href={href} className="group block h-full" onClick={handleClick}>
      <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="absolute inset-0 bg-muted">
          {city.imageUrl && (
            <img 
              src={city.imageUrl} 
              alt={city.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 text-white flex justify-between items-end">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium tracking-wider uppercase mb-1">{city.country}</p>
            <h3 className="text-3xl font-display font-bold leading-tight">{city.name}</h3>
            
            {/* Review Info */}
            <div className="mt-2 flex items-center gap-1 text-sm">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/80">
                {rating.toFixed(1)} {reviewCount > 0 && `(${reviewCount})`}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
}
