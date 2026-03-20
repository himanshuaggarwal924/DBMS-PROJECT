import { useState } from "react";
import { useGetTrips, useCreateTrip } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Map, Calendar, Plus, Navigation } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Trips() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTrip = useCreateTrip();
  const { data: trips, isLoading } = useGetTrips(user?.id as unknown as number || 0);

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Please log in</h1>
        <Link href="/login" className="text-primary hover:underline font-medium">Go to Login</Link>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createTrip.mutateAsync({ userId: user.id, title, startDate, endDate });
      setTitle(""); setStartDate(""); setEndDate(""); setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] }); // Invalidate
    } catch (_err) {
      void _err; // Suppress warning
      alert("Failed to create trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Navigation className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground">My Itineraries</h1>
              <p className="text-muted-foreground mt-1">Plan and manage your upcoming adventures</p>
            </div>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-foreground text-white hover:bg-foreground/90 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-5 h-5"/> New Trip
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-card p-6 rounded-3xl border border-border shadow-lg mb-10 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-xl font-bold mb-4">Create a New Itinerary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="col-span-1 md:col-span-3">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Trip Title</label>
                <input required type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Summer in Goa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-2.5 rounded-xl font-semibold shadow-md hover:bg-primary/90 disabled:opacity-50">Save Trip</button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1,2].map(i => <div key={i} className="h-40 rounded-3xl bg-muted animate-pulse"></div>)}
          </div>
        ) : !trips?.length ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
            <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No trips planned yet</h2>
            <p className="text-muted-foreground">Click the button above to start planning your next journey.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {trips.map(trip => (
              <div key={trip.id} className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                <div className="p-6 md:p-8 bg-linear-to-r from-secondary/50 to-secondary/0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-foreground">{trip.title}</h3>
                    {(trip.startDate || trip.endDate) && (
                      <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4"/> 
                        {trip.startDate ? format(new Date(trip.startDate), 'MMM d, yyyy') : '?'} - 
                        {trip.endDate ? format(new Date(trip.endDate), 'MMM d, yyyy') : '?'}
                      </p>
                    )}
                  </div>
                  <div className="bg-white text-primary px-4 py-2 rounded-full font-bold text-sm shadow-sm border border-border/50">
                    {trip.places?.length || 0} Places saved
                  </div>
                </div>
                
                {trip.places && trip.places.length > 0 && (
                  <div className="p-6 border-t border-border/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {trip.places.map(place => (
                        <Link href={`/place/${place.id}`} key={place.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border">
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                            {place.imageUrl && <img src={place.imageUrl} alt="" className="w-full h-full object-cover"/>}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate">{place.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{place.category}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
