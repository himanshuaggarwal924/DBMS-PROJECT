import { Link } from "wouter";
import { Star, MapPin } from "lucide-react";
import type { Place } from "@workspace/api-client-react";
import SmartImage from "@/components/SmartImage";
import { getPlaceImageSources } from "@/lib/imageUtils";

interface PlaceCardProps {
  place: Place;
  onView?: () => void;
}

export default function PlaceCard({ place, onView }: PlaceCardProps) {
  const handleClick = () => {
    onView?.();
  };
  const imageSources = getPlaceImageSources(place);

  return (
    <Link href={`/place/${place.id}`} className="group block" onClick={handleClick}>
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300">
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <SmartImage
            sources={imageSources}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
          />
          {place.rating && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1 text-sm font-semibold shadow-sm text-foreground">
              <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
              {Number(place.rating).toFixed(1)}
            </div>
          )}
          <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-semibold capitalize tracking-wide shadow-sm">
            {place.category}
          </div>
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {place.name}
            </h3>
            {place.priceLevel && (
              <span className="text-emerald-600 font-bold text-sm tracking-widest">
                ₹{place.priceLevel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{place.cityName || place.address}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {place.reviewCount || 0} reviews
            </span>
            <span className="text-primary text-sm font-semibold flex items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
              View Details &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
