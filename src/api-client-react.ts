import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type UserRole = "user" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface City {
  id: number;
  name: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  state?: string;
  description?: string;
  imageUrl?: string;
  totalPlaces?: number;
  averageRating?: number;
  searchCount?: number;
  reviewCount?: number;
}

export interface Place {
  id: number;
  name: string;
  avgCost?: number | null;
  priceLevel?: number | null;
  rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  cityId: number;
  cityName: string;
  country?: string | null;
  category: string;
  type: string;
  apiPlaceId?: string;
  popularityScore?: number;
  description?: string;
  address?: string;
  imageUrl?: string;
  distanceKm?: number | null;
  isFavorite?: boolean;
  reviewCount?: number;
  localReviewCount?: number;
  localReviewAverage?: number | null;
  savedTogetherCount?: number;
}

export interface Review {
  id: number;
  placeId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface Expense {
  id: number;
  tripId: number;
  placeId?: number | null;
  placeName?: string | null;
  amount: number;
  category: "food" | "travel" | "shopping" | "tickets" | "other";
  spentDate: string;
  note: string;
}

export interface TripBudget {
  plannedBudget: number;
  itineraryPlannedCost: number;
  actualExpenses: number;
  remainingBudget: number;
  byCategory: Array<{
    category: string;
    total: number;
  }>;
}

export interface TripPlace {
  id: number;
  tripId: number;
  placeId: number;
  dayNumber: number;
  visitOrder: number;
  plannedCost?: number | null;
  place: Place;
}

export interface TripSummary {
  id: number;
  userId: number;
  cityId: number;
  cityName: string;
  plannedBudget: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  budget: TripBudget;
}

export interface TripDetail extends TripSummary {
  itinerary: TripPlace[];
  itineraryByDay: Array<{
    dayNumber: number;
    places: TripPlace[];
  }>;
  expenses: Expense[];
}

export interface ForgotPasswordResponse {
  message: string;
  previewPath?: string;
  expiresInMinutes?: number;
}

export interface ResetTokenValidation {
  valid: boolean;
  email?: string;
  expiresAt?: string;
}

export interface CityPlacesResponse {
  city: City;
  source: "database" | "rapidapi";
  places: Place[];
}

export interface AdminDashboardResponse {
  summary: {
    totalUsers: number;
    totalCities: number;
    totalPlaces: number;
  };
  mostPopularCity: {
    cityName: string;
    searchCount: number;
  } | null;
  mostSavedPlace: {
    placeId: number;
    placeName: string;
    saveCount: number;
  } | null;
  userActivityLast7Days: Array<{
    day: string;
    activeUsers: number;
  }>;
  cityWiseStats: Array<{
    cityId: number;
    cityName: string;
    totalPlaces: number;
    averageCost: number;
    mostCommonCategory: string;
  }>;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("travel_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export const getGetPlaceQueryKey = (placeId: number) => ["place", placeId] as const;
export const getGetPlaceReviewsQueryKey = (placeId: number) => ["placeReviews", placeId] as const;
export const getTripDetailQueryKey = (tripId: number) => ["trip", tripId] as const;

export const useGetPopularCities = () =>
  useQuery<City[]>({
    queryKey: ["popularCities"],
    queryFn: async () => {
      const response = await api.get<City[]>("/cities/popular");
      return response.data;
    },
  });

export const useSearchCities = (query: string, options?: { enabled?: boolean }) =>
  useQuery<City[]>({
    queryKey: ["searchCities", query],
    enabled: options?.enabled ?? !!query,
    queryFn: async () => {
      const response = await api.get<City[]>("/cities/search", { params: { q: query } });
      return response.data;
    },
  });

export const useGetCityPlaces = (
  cityId: number,
  options?: {
    category?: string;
    minRating?: number;
    minCost?: number;
    maxCost?: number;
    sortBy?: "rating" | "distance";
    refLat?: number;
    refLng?: number;
    enabled?: boolean;
  }
) =>
  useQuery<CityPlacesResponse>({
    queryKey: ["cityPlaces", cityId, options ?? null],
    enabled: options?.enabled ?? !!cityId,
    queryFn: async () => {
      const response = await api.get<CityPlacesResponse>(`/cities/${cityId}/places`, {
        params: {
          category: options?.category,
          minRating: options?.minRating,
          minCost: options?.minCost,
          maxCost: options?.maxCost,
          sortBy: options?.sortBy,
          refLat: options?.refLat,
          refLng: options?.refLng,
        },
      });
      return response.data;
    },
  });

export const useGetCityPlacesByName = (
  cityName: string,
  options?: {
    category?: string;
    minRating?: number;
    minCost?: number;
    maxCost?: number;
    sortBy?: "rating" | "distance";
    refLat?: number;
    refLng?: number;
    enabled?: boolean;
  }
) =>
  useQuery<CityPlacesResponse>({
    queryKey: ["cityPlacesByName", cityName, options ?? null],
    enabled: options?.enabled ?? !!cityName,
    queryFn: async () => {
      const response = await api.get<CityPlacesResponse>(`/places/city/${encodeURIComponent(cityName)}`, {
        params: {
          category: options?.category,
          minRating: options?.minRating,
          minCost: options?.minCost,
          maxCost: options?.maxCost,
          sortBy: options?.sortBy,
          refLat: options?.refLat,
          refLng: options?.refLng,
        },
      });
      return response.data;
    },
  });

export const useGetTopRatedPlaces = (options?: { limit?: number }) =>
  useQuery<Place[]>({
    queryKey: ["topPlaces", options?.limit ?? 8],
    queryFn: async () => {
      const response = await api.get<Place[]>("/places/top", { params: { limit: options?.limit ?? 8 } });
      return response.data;
    },
  });

export const useGetRecommendations = (options?: { userId?: number; limit?: number; enabled?: boolean }) =>
  useQuery<Place[]>({
    queryKey: ["recommendations", options?.userId ?? null, options?.limit ?? 8],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Place[]>("/places/recommendations", {
        params: {
          userId: options?.userId,
          limit: options?.limit ?? 8,
        },
      });
      return response.data;
    },
  });

export const useLoginUser = () =>
  useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await api.post<{ user: User; token: string }>("/users/login", data);
      return response.data;
    },
  });

export const useRegisterUser = () =>
  useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const response = await api.post<{ user: User; token: string }>("/users/register", data);
      return response.data;
    },
  });

export const useForgotPassword = () =>
  useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await api.post<ForgotPasswordResponse>("/users/forgot-password", data);
      return response.data;
    },
  });

export const useValidateResetToken = (token: string, options?: { enabled?: boolean }) =>
  useQuery<ResetTokenValidation>({
    queryKey: ["resetToken", token],
    enabled: options?.enabled ?? !!token,
    retry: false,
    queryFn: async () => {
      const response = await api.get<ResetTokenValidation>("/users/reset-password/validate", {
        params: { token },
      });
      return response.data;
    },
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await api.post<{ message: string }>("/users/reset-password", data);
      return response.data;
    },
  });

export const useGetFavorites = (options?: { enabled?: boolean }) =>
  useQuery<Place[]>({
    queryKey: ["favorites"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Place[]>("/favorites");
      return response.data;
    },
  });

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (placeId: number) => {
      const response = await api.post(`/favorites/${placeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["place"] });
      queryClient.invalidateQueries({ queryKey: ["cityPlaces"] });
      queryClient.invalidateQueries({ queryKey: ["cityPlacesByName"] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (placeId: number) => {
      const response = await api.delete(`/favorites/${placeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["place"] });
      queryClient.invalidateQueries({ queryKey: ["cityPlaces"] });
      queryClient.invalidateQueries({ queryKey: ["cityPlacesByName"] });
    },
  });
};

export const useGetPlace = (placeId: number) =>
  useQuery<Place>({
    queryKey: getGetPlaceQueryKey(placeId),
    enabled: !!placeId,
    queryFn: async () => {
      const response = await api.get<Place>(`/places/${placeId}/details`);
      return response.data;
    },
  });

export const useGetPlaceReviews = (placeId: number) =>
  useQuery<Review[]>({
    queryKey: getGetPlaceReviewsQueryKey(placeId),
    enabled: !!placeId,
    queryFn: async () => {
      const response = await api.get<Review[]>(`/reviews/place/${placeId}`);
      return response.data;
    },
  });

export const useGetSavedTogetherRecommendations = (placeId: number, options?: { enabled?: boolean }) =>
  useQuery<Place[]>({
    queryKey: ["savedTogether", placeId],
    enabled: options?.enabled ?? !!placeId,
    queryFn: async () => {
      const response = await api.get<Place[]>(`/places/${placeId}/saved-together`);
      return response.data;
    },
  });

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { placeId: number; rating: number; comment: string }) => {
      const response = await api.post<Review>("/reviews", data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getGetPlaceReviewsQueryKey(variables.placeId) });
      queryClient.invalidateQueries({ queryKey: getGetPlaceQueryKey(variables.placeId) });
    },
  });
};

export const useGetTrips = (options?: { enabled?: boolean }) =>
  useQuery<TripSummary[]>({
    queryKey: ["trips"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<TripSummary[]>("/trips");
      return response.data;
    },
  });

export const useGetTrip = (tripId: number, options?: { enabled?: boolean }) =>
  useQuery<TripDetail>({
    queryKey: getTripDetailQueryKey(tripId),
    enabled: options?.enabled ?? !!tripId,
    queryFn: async () => {
      const response = await api.get<TripDetail>(`/trips/${tripId}`);
      return response.data;
    },
  });

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      cityId?: number;
      cityName?: string;
      plannedBudget?: number;
      startDate: string;
      endDate: string;
    }) => {
      const response = await api.post<TripDetail>("/trips", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useAddPlaceToTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tripId: number;
      placeId: number;
      dayNumber: number;
      visitOrder?: number;
      plannedCost?: number;
    }) => {
      const response = await api.post(`/trips/${data.tripId}/places`, {
        placeId: data.placeId,
        dayNumber: data.dayNumber,
        visitOrder: data.visitOrder,
        plannedCost: data.plannedCost,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
    },
  });
};

export const useUpdateTripPlace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tripId: number;
      tripPlaceId: number;
      dayNumber?: number;
      visitOrder?: number;
      plannedCost?: number | null;
    }) => {
      const response = await api.patch(`/trips/${data.tripId}/places/${data.tripPlaceId}`, {
        dayNumber: data.dayNumber,
        visitOrder: data.visitOrder,
        plannedCost: data.plannedCost,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: number) => {
      const response = await api.delete(`/trips/${tripId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useDeleteTripPlace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tripId: number; tripPlaceId: number }) => {
      const response = await api.delete(`/trips/${data.tripId}/places/${data.tripPlaceId}`);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useReorderTripDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tripId: number; dayNumber: number; orderedTripPlaceIds: number[] }) => {
      const response = await api.patch(
        `/trips/${data.tripId}/days/${data.dayNumber}/reorder`,
        { orderedTripPlaceIds: data.orderedTripPlaceIds }
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
    },
  });
};

export const useOptimizeTripDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tripId: number;
      dayNumber: number;
      referenceLat?: number;
      referenceLng?: number;
    }) => {
      const response = await api.post(`/trips/${data.tripId}/optimize-day`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
    },
  });
};

export const useGetTripBudgetDashboard = (tripId: number, options?: { enabled?: boolean }) =>
  useQuery<TripBudget>({
    queryKey: ["tripBudget", tripId],
    enabled: options?.enabled ?? !!tripId,
    queryFn: async () => {
      const response = await api.get<TripBudget>(`/trips/${tripId}/budget-dashboard`);
      return response.data;
    },
  });

export const useGetTripExpenses = (tripId: number, options?: { enabled?: boolean }) =>
  useQuery<Expense[]>({
    queryKey: ["tripExpenses", tripId],
    enabled: options?.enabled ?? !!tripId,
    queryFn: async () => {
      const response = await api.get<Expense[]>(`/trips/${tripId}/expenses`);
      return response.data;
    },
  });

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tripId: number;
      placeId?: number | null;
      amount: number;
      category: Expense["category"];
      spentDate: string;
      note?: string;
    }) => {
      const response = await api.post<Expense>(`/trips/${data.tripId}/expenses`, {
        placeId: data.placeId,
        amount: data.amount,
        category: data.category,
        spentDate: data.spentDate,
        note: data.note,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: ["tripBudget", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["tripExpenses", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tripId: number; expenseId: number }) => {
      const response = await api.delete(`/trips/${data.tripId}/expenses/${data.expenseId}`);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: ["tripBudget", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["tripExpenses", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tripId: number;
      expenseId: number;
      placeId?: number | null;
      amount: number;
      category: Expense["category"];
      spentDate: string;
      note?: string;
    }) => {
      const response = await api.patch<Expense>(`/trips/${data.tripId}/expenses/${data.expenseId}`, {
        placeId: data.placeId ?? null,
        amount: data.amount,
        category: data.category,
        spentDate: data.spentDate,
        note: data.note ?? null,
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getTripDetailQueryKey(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: ["tripBudget", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["tripExpenses", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export interface BestValuePlace {
  placeId: number;
  name: string;
  rating: number | null;
  avgCost: number | null;
  category: string;
  cityName: string;
  valueScore: number;
}

export const useGetBestValuePlaces = (cityId: number, options?: { limit?: number; enabled?: boolean }) =>
  useQuery<BestValuePlace[]>({
    queryKey: ["bestValuePlaces", cityId, options?.limit ?? 10],
    enabled: options?.enabled ?? !!cityId,
    queryFn: async () => {
      const response = await api.get<BestValuePlace[]>(`/cities/${cityId}/best-value`, {
        params: { limit: options?.limit ?? 10 },
      });
      return response.data;
    },
  });

export const useGetAdminDashboard = (options?: { enabled?: boolean }) =>
  useQuery<AdminDashboardResponse>({
    queryKey: ["adminDashboard"],
    enabled: options?.enabled ?? true,
    retry: false,
    queryFn: async () => {
      const response = await api.get<AdminDashboardResponse>("/analytics/admin/dashboard");
      return response.data;
    },
  });

export { api };
