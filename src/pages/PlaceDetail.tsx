import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetPlace,
  useGetPlaceReviews,
  useCreateReview,
  useAddFavorite,
  useGetTrips,
  useAddPlaceToTrip,
  getGetPlaceReviewsQueryKey,
  getGetPlaceQueryKey,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Star, MapPin, Heart, Plus, Map, User, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PlaceDetail() {
  const { id } = useParams();
  const placeId = parseInt(id || "0");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: place, isLoading: loadingPlace } = useGetPlace(placeId);
  const { data: reviews } = useGetPlaceReviews(placeId);
  const { data: trips } = useGetTrips(user?.id || 0);

  const addFavorite = useAddFavorite();
  const addPlaceToTrip = useAddPlaceToTrip();
  const createReview = useCreateReview();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState<number | null>(null);

  if (loadingPlace) {
    return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!place) return <div className="min-h-screen pt-20 text-center py-20 text-2xl font-bold">Place not found</div>;

  const handleFavorite = async () => {
    if (!user) return alert("Please login to save favorites");
    try {
      await addFavorite.mutateAsync({ userId: user.id, placeId });
      alert("Added to favorites!");
    } catch (_e) {
      void _e; // Suppress warning
      alert("Error adding to favorites");
    }
  };

  const handleAddToTrip = async (tripId: number) => {
    setAddingToTrip(tripId);
    try {
      await addPlaceToTrip.mutateAsync({ tripId, placeId });
      alert("Added to trip successfully!");
    } catch (_e) {
      void _e; // Suppress warning
      alert("Failed to add to trip");
    } finally {
      setAddingToTrip(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please login to review");
    
    setSubmitting(true);
    try {
      await createReview.mutateAsync({ placeId, userId: user.id, rating: reviewRating, comment: reviewComment });
      setReviewComment("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: getGetPlaceReviewsQueryKey(placeId) });
      queryClient.invalidateQueries({ queryKey: getGetPlaceQueryKey(placeId) });
    } catch (_e) {
      void _e; // Suppress warning
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Image */}
        <div className="relative h-96 md:h-full rounded-3xl overflow-hidden shadow-2xl mb-10 group">
          {place.imageUrl ? (
            <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center"><MapPin className="w-20 h-20 text-muted-foreground/30" /></div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="bg-primary px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">{place.category}</span>
              <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-bold">
                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" /> {Number(place.rating || 0).toFixed(1)}
              </span>
              <span className="text-emerald-400 font-bold bg-white/20 backdrop-blur px-4 py-1.5 rounded-full">
                {place.priceLevel ? `₹${place.priceLevel}` : 'N/A'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-2">{place.name}</h1>
            <p className="text-lg text-white/80 flex items-center gap-2"><MapPin className="w-5 h-5" /> {place.address}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
              <h2 className="text-2xl font-display font-bold mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {place.description || "A wonderful place to visit on your next trip. Beautiful surroundings, excellent service, and highly rated by fellow travelers."}
              </p>
              {place.tags && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {place.tags.split(',').map(tag => (
                    <span key={tag} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">#{tag.trim()}</span>
                  ))}
                </div>
              )}
            </section>

            {/* Reviews Section */}
            <section>
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Star className="text-yellow-500 w-6 h-6" fill="currentColor"/> Reviews ({place.reviewCount})
              </h2>
              
              {user ? (
                <form onSubmit={handleReviewSubmit} className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm mb-8">
                  <h3 className="font-bold mb-4">Write a Review</h3>
                  <div className="flex gap-2 mb-4">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setReviewRating(star)} className="focus:outline-none">
                        <Star className={`w-8 h-8 transition-colors ${star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-muted'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    className="w-full bg-secondary/50 border border-border rounded-xl p-4 h-24 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 text-foreground placeholder:text-muted-foreground"
                    placeholder="Share your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                  <button disabled={submitting} type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-colors">
                    {submitting ? "Submitting..." : <><Send className="w-4 h-4"/> Post Review</>}
                  </button>
                </form>
              ) : (
                <div className="bg-secondary p-6 rounded-2xl mb-8 text-center text-muted-foreground">
                  Please log in to leave a review.
                </div>
              )}

              <div className="space-y-4">
                {reviews?.length ? reviews.map(review => (
                  <div key={review.id} className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0 font-bold text-lg">
                      {review.userName?.charAt(0) || <User />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{review.userName}</span>
                        <span className="flex text-yellow-400">
                          {Array(review.rating).fill(0).map((_,i)=><Star key={i} className="w-3.5 h-3.5" fill="currentColor"/>)}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                )) : <p className="text-muted-foreground">No reviews yet. Be the first!</p>}
              </div>
            </section>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-lg sticky top-28">
              <h3 className="font-display font-bold text-xl mb-6">Plan Your Trip</h3>
              
              <button 
                onClick={handleFavorite}
                className="w-full mb-4 py-4 rounded-xl border-2 border-accent text-accent font-bold flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all duration-300"
              >
                <Heart className="w-5 h-5" /> Save to Favorites
              </button>

              <div className="h-px bg-border my-6"></div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Add to Trip</p>
                {!user ? (
                  <p className="text-sm text-muted-foreground">Log in to add to trips</p>
                ) : !trips?.length ? (
                  <p className="text-sm text-muted-foreground">You don't have any trips yet.</p>
                ) : (
                  trips.map(trip => (
                    <button 
                      key={trip.id}
                      onClick={() => handleAddToTrip(trip.id)}
                      disabled={addingToTrip === trip.id}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-colors text-left"
                    >
                      <span className="font-medium flex items-center gap-2"><Map className="w-4 h-4"/> {trip.title}</span>
                      <Plus className="w-4 h-4" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
