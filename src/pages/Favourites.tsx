import { Heart } from "lucide-react";
import { Link } from "wouter";
import { useGetFavorites } from "@workspace/api-client-react";
import { useAuth } from "@/lib/useAuthHook";
import PlaceCard from "@/components/PlaceCard";

export default function Favorites() {
  const { user } = useAuth();
  const favoritesQuery = useGetFavorites({ enabled: !!user });

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-10 text-center shadow-sm">
          <h1 className="text-3xl font-display font-bold text-foreground">Sign in to view your favorites</h1>
          <p className="mt-4 text-muted-foreground">
            Save places from the city and place screens, then revisit them here.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const favorites = favoritesQuery.data || [];

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Heart className="h-7 w-7 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground">Favorites</h1>
              <p className="mt-2 text-muted-foreground">
                Shortlisted hotels, restaurants, and attractions saved to your account.
              </p>
            </div>
          </div>
        </div>

        {favoritesQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-[2rem] bg-muted" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border bg-card p-12 text-center">
            <h2 className="text-2xl font-display font-bold text-foreground">Nothing saved yet</h2>
            <p className="mt-3 text-muted-foreground">
              Explore a city, open a place, and save it to build your shortlist.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Explore cities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {favorites.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
