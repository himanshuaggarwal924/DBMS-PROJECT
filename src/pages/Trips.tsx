import { useState } from "react";
import { Link } from "wouter";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Coins,
  MapPin,
  Plus,
  Receipt,
  Route,
  Trash2,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  useCreateExpense,
  useCreateTrip,
  useDeleteExpense,
  useDeleteTrip,
  useDeleteTripPlace,
  useGetTrip,
  useGetTrips,
  useOptimizeTripDay,
  useReorderTripDay,
  useSearchCities,
  useUpdateExpense,
  useUpdateTripPlace,
  type Expense,
  type TripPlace,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/useAuthHook";

type DraftMap = Record<number, { dayNumber: string; visitOrder: string; plannedCost: string }>;

function createDraft(place: TripPlace) {
  return {
    dayNumber: String(place.dayNumber),
    visitOrder: String(place.visitOrder),
    plannedCost:
      place.plannedCost !== null && place.plannedCost !== undefined
        ? String(place.plannedCost)
        : "",
  };
}

function BudgetBar({ planned, itinerary, actual }: { planned: number; itinerary: number; actual: number }) {
  if (planned <= 0) return null;
  const pct = (v: number) => Math.min(100, (v / planned) * 100).toFixed(1);
  const over = actual > planned;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Budget usage</span>
        <span className={over ? "text-destructive" : "text-emerald-600"}>
          {pct(actual)}% spent
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        {/* Itinerary (planned itinerary cost) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent/60 transition-all duration-700"
          style={{ width: `${pct(itinerary)}%` }}
        />
        {/* Actual spend */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
            over ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${pct(actual)}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-full bg-primary" />
          Actual spend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-full bg-accent/60" />
          Planned itinerary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-full bg-muted border border-border" />
          Total budget
        </span>
      </div>
    </div>
  );
}

export default function Trips() {
  const { user } = useAuth();
  const tripsQuery = useGetTrips({ enabled: !!user });
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const updateTripPlace = useUpdateTripPlace();
  const deleteTripPlace = useDeleteTripPlace();
  const optimizeTripDay = useOptimizeTripDay();
  const reorderTripDay = useReorderTripDay();

  function handleMovePlace(
    dayGroup: { dayNumber: number; places: TripPlace[] },
    placeId: number,
    direction: "up" | "down"
  ) {
    const ids = dayGroup.places.map((p) => p.id);
    const idx = ids.indexOf(placeId);
    if (direction === "up" && idx <= 0) return;
    if (direction === "down" && idx >= ids.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newIds = [...ids];
    [newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]];
    if (!trip) return;
    reorderTripDay.mutate({ tripId: trip.id, dayNumber: dayGroup.dayNumber, orderedTripPlaceIds: newIds });
  }

  // Derive the active trip: keep explicit selection, fall back to the first trip.
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const effectiveTripId = selectedTripId ?? (tripsQuery.data?.[0]?.id ?? null);

  const tripQuery = useGetTrip(effectiveTripId || 0, { enabled: !!effectiveTripId });
  const trip = tripQuery.data;

  const [cityName, setCityName] = useState("");
  const [plannedBudget, setPlannedBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const citySearch = useSearchCities(cityName, { enabled: cityName.trim().length >= 2 });

  const [editedDrafts, setEditedDrafts] = useState<DraftMap>({});
  const drafts: DraftMap = {};
  for (const item of trip?.itinerary ?? []) {
    drafts[item.id] = editedDrafts[item.id] ?? createDraft(item);
  }

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<Expense["category"]>("food");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expensePlaceId, setExpensePlaceId] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [expenseEdits, setExpenseEdits] = useState<Record<
    number,
    {
      amount: string;
      category: Expense["category"];
      spentDate: string;
      note: string;
      placeId: string;
    }
  >>({});

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background py-10">
        <div className="mx-auto max-w-md rounded-4xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Route className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Sign in to manage trips</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Plan itineraries, optimise routes, and track spending all in one place.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const trips = tripsQuery.data || [];

  const handleCreateTrip = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const created = await createTrip.mutateAsync({
      cityName,
      plannedBudget: plannedBudget ? Number(plannedBudget) : 0,
      startDate,
      endDate,
    });
    setCityName("");
    setPlannedBudget("");
    setStartDate("");
    setEndDate("");
    setSelectedTripId(created.id);
  };

  const handleLogExpense = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!trip) return;
    await createExpense.mutateAsync({
      tripId: trip.id,
      placeId: expensePlaceId ? Number(expensePlaceId) : null,
      amount: Number(expenseAmount),
      category: expenseCategory,
      spentDate: expenseDate,
      note: expenseNote,
    });
    setExpenseAmount("");
    setExpenseCategory("food");
    setExpenseDate("");
    setExpenseNote("");
    setExpensePlaceId("");
  };

  const handleStartEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setExpenseEdits((current) => ({
      ...current,
      [expense.id]: {
        amount: expense.amount.toFixed(2),
        category: expense.category,
        spentDate: String(expense.spentDate).slice(0, 10),
        note: expense.note,
        placeId: expense.placeId ? String(expense.placeId) : "",
      },
    }));
  };

  const handleCancelEditExpense = (expenseId: number) => {
    setEditingExpenseId((current) => (current === expenseId ? null : current));
    setExpenseEdits((current) => {
      const next = { ...current };
      delete next[expenseId];
      return next;
    });
  };

  const handleSaveExpense = async (expenseId: number) => {
    const edit = expenseEdits[expenseId];
    if (!trip || !edit) return;
    await updateExpense.mutateAsync({
      tripId: trip.id,
      expenseId,
      placeId: edit.placeId ? Number(edit.placeId) : null,
      amount: Number(edit.amount),
      category: edit.category,
      spentDate: edit.spentDate,
      note: edit.note,
    });
    setEditingExpenseId(null);
    setExpenseEdits((current) => {
      const next = { ...current };
      delete next[expenseId];
      return next;
    });
  };

  const CATEGORY_COLORS: Record<string, string> = {
    food: "bg-orange-50 text-orange-700",
    travel: "bg-blue-50 text-blue-700",
    shopping: "bg-pink-50 text-pink-700",
    tickets: "bg-purple-50 text-purple-700",
    other: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 rounded-4xl border border-border bg-card p-8 shadow-sm">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
            <Route className="h-4 w-4 text-primary" />
            Trip planner
          </p>
          <h1 className="text-4xl font-display font-bold text-foreground">Trips &amp; Budgets</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Create trips, add places from any place page, edit day order, optimise each day by
            distance (Haversine), and compare planned budget against actual expenses.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[340px_1fr]">
          {/* ── Left sidebar ── */}
          <aside className="space-y-6">

            {/* Create trip form */}
            <section className="rounded-4xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground">New trip</h2>
                  <p className="text-xs text-muted-foreground">City, dates, and budget</p>
                </div>
              </div>

              <form onSubmit={handleCreateTrip} className="space-y-3">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    list="trip-city-suggestions"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Destination city"
                    required
                    className="w-full rounded-2xl border border-border bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
                  />
                  <datalist id="trip-city-suggestions">
                    {(citySearch.data || []).map((city) => (
                      <option key={city.id} value={city.name} />
                    ))}
                  </datalist>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={plannedBudget}
                  onChange={(e) => setPlannedBudget(e.target.value)}
                  placeholder="Planned budget (₹)"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Start</label>
                    <input
                      required
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">End</label>
                    <input
                      required
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createTrip.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {createTrip.isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create trip
                </button>
              </form>
            </section>

            {/* Trip list */}
            <section className="rounded-4xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-display font-semibold text-foreground">Your trips</h2>
              <div className="space-y-2">
                {tripsQuery.isLoading ? (
                  [1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-3xl" />)
                ) : trips.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No trips yet — create one above.
                  </div>
                ) : (
                  trips.map((item) => {
                    const remaining = item.budget?.remainingBudget ?? 0;
                    const isSelected = effectiveTripId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-stretch gap-2 rounded-3xl border transition-all ${
                          isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedTripId(item.id)}
                          className="flex-1 p-4 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">{item.cityName}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {String(item.startDate).slice(0, 10)} → {String(item.endDate).slice(0, 10)}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                                remaining < 0
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {remaining < 0 ? "-" : "+"}₹{Math.abs(remaining).toFixed(0)}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          title="Delete trip"
                          disabled={deleteTrip.isPending}
                          onClick={() => {
                            if (!confirm(`Delete trip to ${item.cityName}? This cannot be undone.`)) return;
                            deleteTrip.mutate(item.id, {
                              onSuccess: () => {
                                if (selectedTripId === item.id) setSelectedTripId(null);
                              },
                            });
                          }}
                          className="flex items-center px-3 text-muted-foreground hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>

          {/* ── Main content ── */}
          <section className="space-y-6">
            {!effectiveTripId ? (
              <div className="rounded-4xl border border-dashed border-border bg-card p-16 text-center">
                <Route className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <h2 className="mt-4 text-2xl font-display font-bold text-foreground">Select a trip</h2>
                <p className="mt-2 text-muted-foreground">
                  Choose one from the left to manage its itinerary and expenses.
                </p>
              </div>
            ) : tripQuery.isLoading ? (
              <div className="space-y-6">
                <div className="h-48 skeleton rounded-4xl" />
                <div className="h-96 skeleton rounded-4xl" />
              </div>
            ) : !trip ? (
              <div className="rounded-4xl border border-red-200 bg-red-50 p-8 text-red-700">
                Trip details could not be loaded. Check the backend connection.
              </div>
            ) : (
              <>
                {/* Budget overview */}
                <div className="rounded-4xl border border-border bg-card p-8 shadow-sm">
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                        Active trip
                      </p>
                      <h2 className="text-3xl font-display font-bold text-foreground">{trip.cityName}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {String(trip.startDate).slice(0, 10)} → {String(trip.endDate).slice(0, 10)}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-3xl bg-secondary/50 px-5 py-3 text-xs text-muted-foreground max-w-xs">
                      Add places from any place detail page, then edit day/order here.
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
                    {[
                      { label: "Planned budget", value: `₹${trip.budget.plannedBudget.toFixed(2)}`, color: "text-foreground" },
                      { label: "Itinerary cost",  value: `₹${trip.budget.itineraryPlannedCost.toFixed(2)}`, color: "text-accent" },
                      { label: "Actual expenses", value: `₹${trip.budget.actualExpenses.toFixed(2)}`, color: "text-foreground" },
                      {
                        label: "Remaining",
                        value: `₹${Math.abs(trip.budget.remainingBudget).toFixed(2)}`,
                        color: trip.budget.remainingBudget < 0 ? "text-destructive" : "text-emerald-600",
                        prefix: trip.budget.remainingBudget < 0 ? "⚠ Over by " : "",
                      },
                    ].map((s) => (
                      <div key={s.label} className="rounded-3xl border border-border bg-white p-4">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`mt-1.5 text-xl font-display font-bold ${s.color}`}>
                          {s.prefix}{s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <BudgetBar
                    planned={trip.budget.plannedBudget}
                    itinerary={trip.budget.itineraryPlannedCost}
                    actual={trip.budget.actualExpenses}
                  />
                </div>

                {/* Itinerary */}
                <div className="rounded-4xl border border-border bg-card p-8 shadow-sm">
                  <h3 className="mb-1 text-xl font-display font-semibold text-foreground">Itinerary</h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Edit day, visit order, and planned cost per stop. Optimise a whole day by
                    Haversine distance with one click.
                  </p>

                  {trip.itineraryByDay.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
                      <MapPin className="mx-auto mb-3 h-8 w-8 opacity-30" />
                      <p className="font-medium">No places added yet.</p>
                      <p className="mt-1 text-sm">
                        Search a city, open a place, and use "Add to trip" to start building your itinerary.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {trip.itineraryByDay.map((dayGroup) => (
                        <div key={dayGroup.dayNumber} className="rounded-3xl border border-border bg-secondary/30 p-5">
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white text-sm font-bold">
                                {dayGroup.dayNumber}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">Day {dayGroup.dayNumber}</p>
                                <p className="text-xs text-muted-foreground">
                                  {dayGroup.places.length} stop{dayGroup.places.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                optimizeTripDay.mutate({ tripId: trip.id, dayNumber: dayGroup.dayNumber })
                              }
                              disabled={optimizeTripDay.isPending}
                              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-foreground/80 disabled:opacity-60"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Optimise by distance
                            </button>
                          </div>

                          <div className="space-y-3">
                            {dayGroup.places.map((place) => {
                              const draft = drafts[place.id] || createDraft(place);
                              return (
                                <div key={place.id} className="rounded-3xl border border-border bg-white p-4">
                                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="flex items-start gap-3">
                                      <div className="flex flex-col items-center gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleMovePlace(dayGroup, place.id, "up")}
                                          disabled={place.visitOrder === 1 || reorderTripDay.isPending}
                                          className="rounded-lg border border-border p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                                        >
                                          <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-muted-foreground">
                                          {place.visitOrder}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleMovePlace(dayGroup, place.id, "down")}
                                          disabled={place.visitOrder === dayGroup.places.length || reorderTripDay.isPending}
                                          className="rounded-lg border border-border p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                                        >
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-foreground">{place.place.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {place.place.category} · {place.place.cityName}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 xl:min-w-[360px]">
                                      {[
                                        {
                                          value: draft.dayNumber,
                                          placeholder: "Day",
                                          key: "dayNumber" as const,
                                        },
                                        {
                                          value: draft.visitOrder,
                                          placeholder: "Order",
                                          key: "visitOrder" as const,
                                        },
                                        {
                                          value: draft.plannedCost,
                                          placeholder: "Cost (₹)",
                                          key: "plannedCost" as const,
                                        },
                                      ].map((field) => (
                                        <input
                                          key={field.key}
                                          type="number"
                                          min="0"
                                          step={field.key === "plannedCost" ? "0.01" : "1"}
                                          value={field.value}
                                          placeholder={field.placeholder}
                                          onChange={(e) =>
                                            setEditedDrafts((cur) => ({
                                              ...cur,
                                              [place.id]: { ...draft, [field.key]: e.target.value },
                                            }))
                                          }
                                          className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateTripPlace.mutate({
                                          tripId: trip.id,
                                          tripPlaceId: place.id,
                                          dayNumber: Number(draft.dayNumber),
                                          visitOrder: Number(draft.visitOrder),
                                          plannedCost: draft.plannedCost ? Number(draft.plannedCost) : null,
                                        })
                                      }
                                      disabled={updateTripPlace.isPending}
                                      className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-60"
                                    >
                                      Save stop
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteTripPlace.mutate({ tripId: trip.id, tripPlaceId: place.id })
                                      }
                                      disabled={deleteTripPlace.isPending}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Log expense + Expense history */}
                <div className="grid gap-6 xl:grid-cols-2">

                  {/* Log expense form */}
                  <div className="rounded-4xl border border-border bg-card p-8 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <Coins className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-semibold text-foreground">Log expense</h3>
                        <p className="text-xs text-muted-foreground">Record actual spend for this trip</p>
                      </div>
                    </div>

                    <form onSubmit={handleLogExpense} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-full rounded-2xl border border-border bg-secondary/40 py-3 pl-7 pr-4 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <input
                          required
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value as Expense["category"])}
                          className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:border-primary"
                        >
                          <option value="food">🍽 Food</option>
                          <option value="travel">✈ Travel</option>
                          <option value="shopping">🛍 Shopping</option>
                          <option value="tickets">🎟 Tickets</option>
                          <option value="other">📦 Other</option>
                        </select>
                        <select
                          value={expensePlaceId}
                          onChange={(e) => setExpensePlaceId(e.target.value)}
                          className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:border-primary"
                        >
                          <option value="">General expense</option>
                          {trip.itinerary.map((item) => (
                            <option key={item.placeId} value={item.placeId}>
                              {item.place.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <textarea
                        value={expenseNote}
                        onChange={(e) => setExpenseNote(e.target.value)}
                        placeholder="Optional note…"
                        rows={3}
                        className="w-full rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                      />

                      <button
                        type="submit"
                        disabled={createExpense.isPending}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-bold text-white hover:bg-foreground/85 disabled:opacity-60"
                      >
                        {createExpense.isPending ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Log expense
                      </button>
                    </form>
                  </div>

                  {/* Expense history */}
                  <div className="rounded-4xl border border-border bg-card p-8 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-semibold text-foreground">Expense history</h3>
                        <p className="text-xs text-muted-foreground">Actual spend rolled into the budget bar</p>
                      </div>
                    </div>

                    {trip.expenses.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
                        <TrendingDown className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm font-medium">No expenses logged yet.</p>
                      </div>
                    ) : (
                      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                        {trip.expenses.map((expense) => {
                          const isEditing = editingExpenseId === expense.id;
                          const edit = expenseEdits[expense.id];
                          return (
                            <div
                              key={expense.id}
                              className="rounded-3xl border border-border bg-white p-4"
                            >
                              {isEditing && edit ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={edit.amount}
                                        onChange={(e) =>
                                          setExpenseEdits((current) => ({
                                            ...current,
                                            [expense.id]: {
                                              ...edit,
                                              amount: e.target.value,
                                            },
                                          }))
                                        }
                                        className="w-full rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
                                      <input
                                        type="date"
                                        value={edit.spentDate}
                                        onChange={(e) =>
                                          setExpenseEdits((current) => ({
                                            ...current,
                                            [expense.id]: {
                                              ...edit,
                                              spentDate: e.target.value,
                                            },
                                          }))
                                        }
                                        className="w-full rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <select
                                      value={edit.category}
                                      onChange={(e) =>
                                        setExpenseEdits((current) => ({
                                          ...current,
                                          [expense.id]: {
                                            ...edit,
                                            category: e.target.value as Expense["category"],
                                          },
                                        }))
                                      }
                                      className="rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
                                    >
                                      <option value="food">Food</option>
                                      <option value="travel">Travel</option>
                                      <option value="shopping">Shopping</option>
                                      <option value="tickets">Tickets</option>
                                      <option value="other">Other</option>
                                    </select>
                                    <select
                                      value={edit.placeId}
                                      onChange={(e) =>
                                        setExpenseEdits((current) => ({
                                          ...current,
                                          [expense.id]: {
                                            ...edit,
                                            placeId: e.target.value,
                                          },
                                        }))
                                      }
                                      className="rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
                                    >
                                      <option value="">General expense</option>
                                      {trip.itinerary.map((item) => (
                                        <option key={item.placeId} value={item.placeId}>
                                          {item.place.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <textarea
                                    value={edit.note}
                                    onChange={(e) =>
                                      setExpenseEdits((current) => ({
                                        ...current,
                                        [expense.id]: {
                                          ...edit,
                                          note: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Note"
                                    rows={2}
                                    className="w-full rounded-2xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`mt-0.5 shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold capitalize ${
                                        CATEGORY_COLORS[expense.category] ?? "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {expense.category}
                                    </span>
                                    <div>
                                      <p className="font-semibold text-foreground">₹{expense.amount.toFixed(2)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {String(expense.spentDate).slice(0, 10)}
                                        {expense.placeName ? ` · ${expense.placeName}` : ""}
                                      </p>
                                      {expense.note && (
                                        <p className="mt-0.5 text-xs text-muted-foreground italic">{expense.note}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditExpense(expense)}
                                      className="rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteExpense.mutate({ tripId: trip.id, expenseId: expense.id })}
                                      disabled={deleteExpense.isPending}
                                      className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}

                              {isEditing && edit && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveExpense(expense.id)}
                                    disabled={updateExpense.isPending}
                                    className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-white hover:bg-foreground/90 disabled:opacity-60"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelEditExpense(expense.id)}
                                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
