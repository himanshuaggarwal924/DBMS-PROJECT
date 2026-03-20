import { useGetFavorites } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import PlaceCard from "@/components/PlaceCard";
import { Heart, Search } from "lucide-react";
import { Link } from "wouter";

export default function Favorites() {
  const { user } = useAuth();
  const { data: favorites, isLoading } = useGetFavorites(user?.id as unknown as number || 0);
  
  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Please log in</h1>
        <Link href="/login" className="text-primary hover:underline font-medium">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
            <Heart className="w-7 h-7 text-accent" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground">Your Favorites</h1>
            <p className="text-muted-foreground mt-1">Places you've saved for later</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse"></div>)}
          </div>
        ) : !favorites?.length ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-border border-dashed">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">Start exploring to save your favorite places.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold transition-colors">
              <Search className="w-4 h-4"/> Discover Places
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map(place => (
              <div key={place.id} className="relative">
                <PlaceCard place={place} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
