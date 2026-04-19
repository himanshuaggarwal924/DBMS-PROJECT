import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import {
  CalendarDays,
  Heart,
  MapPin,
  Plus,
  Receipt,
  Sparkles,
  Star,
} from "lucide-react";
import {
  useAddFavorite,
  useAddPlaceToTrip,
  useCreateReview,
  useGetPlace,
  useGetPlaceReviews,
  useGetSavedTogetherRecommendations,
  useGetTrips,
  useRemoveFavorite,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/useAuthHook";
import PlaceCard from "@/components/PlaceCard";
import SmartImage from "@/components/SmartImage";
import { getPlaceImageSources } from "@/lib/imageUtils";

function StarRating({
  value,
  max = 5,
  interactive = false,
  onChange,
}: {
  value: number;
  max?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer focus:outline-none" : "pointer-events-none"}
          aria-label={interactive ? `Rate ${n} star${n !== 1 ? "s" : ""}` : undefined}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              n <= display
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      {!interactive && (
        <span className="ml-1.5 text-sm font-semibold text-foreground">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

const CATEGORY_BADGE: Record<string, string> = {
  Hotel:      "badge-hotel",
  Restaurant: "badge-restaurant",
  Attraction: "badge-attraction",
};

export default function PlaceDetail() {
  const params = useParams();
  const placeId = Number.parseInt(params.id || "0", 10);
  const { user } = useAuth();

  const placeQuery    = useGetPlace(placeId);
  const reviewsQuery  = useGetPlaceReviews(placeId);
  const recsQuery     = useGetSavedTogetherRecommendations(placeId, { enabled: !!placeId });
  const tripsQuery    = useGetTrips({ enabled: !!user });

  const addFavorite    = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const createReview   = useCreateReview();
  const addPlaceToTrip = useAddPlaceToTrip();

  const [rating,         setRating]         = useState(5);
  const [comment,        setComment]        = useState("");
  const [selectedTripId, setSelectedTripId] = useState<number | "">("");
  const [dayNumber,      setDayNumber]      = useState(1);
  const [visitOrder,     setVisitOrder]     = useState("");
  const [plannedCost,    setPlannedCost]    = useState("");

  const place           = placeQuery.data;
  const reviews         = reviewsQuery.data || [];
  const recommendations = recsQuery.data || [];
  const trips           = tripsQuery.data || [];

  const imageSources = useMemo(
    () => (place ? getPlaceImageSources(place) : []),
    [place],
  );

  if (placeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="h-96 skeleton rounded-4xl" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-64 skeleton rounded-4xl" />
            <div className="h-64 skeleton rounded-4xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background py-10">
        <div className="mx-auto max-w-md rounded-4xl border border-border bg-card p-10 text-center">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h1 className="text-2xl font-display font-bold text-foreground">Place not found</h1>
          <Link href="/search" className="mt-5 inline-block text-sm text-primary hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  const handleFavorite = async () => {
    if (!user) { window.alert("Sign in to save places to favorites."); return; }
    place.isFavorite
      ? await removeFavorite.mutateAsync(place.id)
      : await addFavorite.mutateAsync(place.id);
  };

  const handleReview = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!user) { window.alert("Sign in to post a review."); return; }
    await createReview.mutateAsync({ placeId: place.id, rating, comment });
    setComment("");
    setRating(5);
  };

  const handleAddToTrip = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!selectedTripId) return;
    await addPlaceToTrip.mutateAsync({
      tripId:     Number(selectedTripId),
      placeId:    place.id,
      dayNumber,
      visitOrder: visitOrder ? Number(visitOrder) : undefined,
      plannedCost: plannedCost ? Number(plannedCost) : undefined,
    });
    setVisitOrder("");
    setPlannedCost("");
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Hero card ── */}
        <section className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">

            {/* Image */}
            <div className="relative min-h-80 bg-muted lg:min-h-[28rem]">
              <SmartImage
                sources={imageSources}
                alt={place.name}
                className="h-full w-full object-cover"
                fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />

              {/* Overlay badges */}
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`badge ${CATEGORY_BADGE[place.category] ?? "badge-primary"} bg-white/20 !text-white backdrop-blur-sm`}>
                    {place.category}
                  </span>
                  {place.rating && (
                    <span className="badge bg-white/20 text-white backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {Number(place.rating).toFixed(1)}
                    </span>
                  )}
                  {place.avgCost && (
                    <span className="badge bg-white/20 text-white backdrop-blur-sm">
                      ₹{place.avgCost} avg
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-display font-bold drop-shadow md:text-4xl">{place.name}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {place.cityName}{place.address ? `, ${place.address}` : ""}
                </p>
              </div>
            </div>

            {/* Actions panel */}
            <div className="space-y-5 p-6 md:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Trip planning
                </p>
                <h2 className="mt-2 text-xl font-display font-bold text-foreground">
                  Save or add to itinerary
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Save to favourites for shortlisting, or assign it to a trip day with a
                  visit order and optional planned cost.
                </p>
              </div>

              {/* Favourite button */}
              <button
                type="button"
                onClick={handleFavorite}
                disabled={addFavorite.isPending || removeFavorite.isPending}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all ${
                  place.isFavorite
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100 ring-1 ring-rose-200"
                    : "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/30"
                }`}
              >
                <Heart className={`h-4 w-4 ${place.isFavorite ? "fill-current" : ""}`} />
                {place.isFavorite ? "Remove from favorites" : "Save to favorites"}
              </button>

              {/* Add-to-trip form */}
              <form
                onSubmit={handleAddToTrip}
                className="rounded-3xl border border-border bg-secondary/40 p-5 space-y-3"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Add to trip itinerary
                </p>

                {!user ? (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                    {" "}to add this place to a trip.
                  </p>
                ) : trips.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/trips" className="text-primary font-semibold hover:underline">Create a trip first</Link>
                    , then come back here.
                  </p>
                ) : (
                  <>
                    <select
                      required
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(Number(e.target.value))}
                      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select a trip</option>
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.cityName} ({String(t.startDate).slice(0, 10)} → {String(t.endDate).slice(0, 10)})
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: dayNumber,   setter: (v: string) => setDayNumber(Number(v)),  placeholder: "Day",   min: 1 },
                        { value: visitOrder,  setter: setVisitOrder,  placeholder: "Order",  min: 1 },
                        { value: plannedCost, setter: setPlannedCost, placeholder: "Cost ₹", min: 0 },
                      ].map((f) => (
                        <input
                          key={f.placeholder}
                          type="number"
                          min={f.min}
                          step={f.placeholder === "Cost ₹" ? "0.01" : "1"}
                          value={f.value}
                          onChange={(e) => f.setter(e.target.value)}
                          placeholder={f.placeholder}
                          className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={addPlaceToTrip.isPending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-bold text-white hover:bg-foreground/85 disabled:opacity-60"
                    >
                      {addPlaceToTrip.isPending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add stop to trip
                    </button>
                  </>
                )}
              </form>

              {/* Cost & review snapshot */}
              <div className="rounded-3xl border border-border p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Receipt className="h-4 w-4 text-primary" />
                  Quick stats
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Average cost</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {place.avgCost ? `₹${place.avgCost}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Local review avg</p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {place.localReviewAverage
                        ? `${place.localReviewAverage.toFixed(1)} / 5`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Reviews + Recommendations ── */}
        <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">

          {/* Reviews section */}
          <section className="rounded-4xl border border-border bg-card p-8 shadow-sm">
            <h2 className="mb-2 text-2xl font-display font-bold text-foreground">About this place</h2>
            <p className="mb-6 text-sm leading-7 text-muted-foreground">
              {place.description || "This venue was imported from the travel data cache for the selected city."}
            </p>

            <div className="mb-5 flex items-center gap-3">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <h3 className="text-lg font-display font-semibold text-foreground">User reviews</h3>
              {reviews.length > 0 && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {reviews.length}
                </span>
              )}
            </div>

            {/* Review form */}
            {user && (
              <form
                onSubmit={handleReview}
                className="mb-6 rounded-3xl border border-border bg-secondary/40 p-5 space-y-4"
              >
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Your rating</p>
                  <StarRating value={rating} interactive onChange={setRating} />
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience…"
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                />
                <button
                  type="submit"
                  disabled={createReview.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {createReview.isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  Post review
                </button>
              </form>
            )}

            {/* Review list */}
            {reviewsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-24 skeleton rounded-3xl" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <Star className="mx-auto mb-2 h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">No local reviews yet.</p>
                {user
                  ? <p className="mt-1 text-xs">Be the first to review this place!</p>
                  : <p className="mt-1 text-xs">
                      <Link href="/login" className="text-primary hover:underline">Sign in</Link> to leave a review.
                    </p>
                }
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-border bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{review.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {review.createdAt ? String(review.createdAt).slice(0, 10) : ""}
                          </p>
                        </div>
                      </div>
                      <StarRating value={Number(review.rating)} max={5} />
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved-together recommendations */}
          <section className="rounded-4xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Frequently saved together
                </h2>
                <p className="text-xs text-muted-foreground">
                  Powered by a self-join on the favorites table
                </p>
              </div>
            </div>

            {recsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton rounded-3xl" />)}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">Not enough favorite history yet.</p>
                <p className="mt-1 text-xs">Save more places to unlock bundle recommendations.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {recommendations.map((rec) => (
                  <PlaceCard key={rec.id} place={rec} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
