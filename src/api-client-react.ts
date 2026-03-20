import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
}

export interface City {
  id: number;
  name: string;
  country: string;
  state?: string;
  imageUrl?: string;
  description?: string;
  searchCount?: number;
}

export interface Place {
  id: number;
  name: string;
  city: string;
  cityName?: string;
  type?: "hotel" | "restaurant" | "attraction";
  rating?: number;
  address?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  priceLevel?: number;
  tags?: string;
  reviewCount?: number;
}

export interface Review {
  id: number;
  userId: number;
  placeId: number;
  rating: number;
  comment: string;
  userName?: string;
  createdAt?: string;
}

export interface Trip {
  id: number;
  userId: number;
  title: string;
  startDate?: string;
  endDate?: string;
  places?: Place[];
  createdAt?: string;
}

export const getGetPlaceQueryKey = (placeId: number) => ["place", placeId];
export const getGetPlaceReviewsQueryKey = (placeId: number) => ["placeReviews", placeId];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const useGetPopularCities = () =>
  useQuery<City[]>({
    queryKey: ["popularCities"],
    queryFn: async () => {
      const response = await api.get<City[]>("/cities/popular");
      return response.data;
    },
  });

export const useGetTopRatedPlaces = (options?: { limit?: number }) => {
  const key = ["topPlaces", options?.limit ?? 10] as const;
  return useQuery<Place[]>({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get<Place[]>("/places/top", {
        params: { limit: options?.limit ?? 10 },
      });
      return response.data;
    },
  });
};

export const useGetRecommendations = (options?: { userId?: number }) => {
  const key = ["recommendations", options?.userId ?? null] as const;
  return useQuery<Place[]>({
    queryKey: key,
    queryFn: async () => {
      const response = await api.get<Place[]>("/places/recommendations", {
        params: { userId: options?.userId },
      });
      return response.data;
    },
  });
};

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
  options?: { category?: string; minRating?: number; enabled?: boolean }
) =>
  useQuery<Place[]>({
    queryKey: ["cityPlaces", cityId, options?.category, options?.minRating],
    enabled: options?.enabled ?? !!cityId,
    queryFn: async () => {
      const response = await api.get<Place[]>(`/cities/${cityId}/places`, {
        params: {
          category: options?.category,
          minRating: options?.minRating,
        },
      });
      return response.data;
    },
  });

export const useGetCityPlacesByName = (
  cityName: string,
  options?: { category?: string; enabled?: boolean }
) =>
  useQuery<Place[]>({
    queryKey: ["cityPlacesByName", cityName, options?.category],
    enabled: options?.enabled ?? !!cityName,
    queryFn: async () => {
      const response = await api.get<Place[]>(`/places/city/${encodeURIComponent(cityName)}`, {
        params: {
          category: options?.category,
        },
      });
      return response.data;
    },
  });

export const useLoginUser = () =>
  useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await api.post("/users/login", data);
      return response.data as { token: string; user: User };
    },
  });

export const useRegisterUser = () =>
  useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const response = await api.post("/users/register", data);
      return response.data as { id: number; name: string; email: string; createdAt: string };
    },
  });

export const useGetFavorites = (userId: number) =>
  useQuery<Place[]>({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const response = await api.get<Place[]>(`/favorites/${userId}`);
      return response.data;
    },
  });

export const useGetTrips = (userId: number) =>
  useQuery<Trip[]>({
    queryKey: ["trips", userId],
    queryFn: async () => {
      const response = await api.get<Trip[]>(`/trips/${userId}`);
      return response.data;
    },
  });

export const useCreateTrip = () =>
  useMutation({
    mutationFn: async (data: { userId: number; title: string; startDate?: string; endDate?: string }) => {
      const response = await api.post("/trips", data);
      return response.data;
    },
  });

export const useGetPlace = (placeId: number) =>
  useQuery<Place | null>({
    queryKey: getGetPlaceQueryKey(placeId),
    queryFn: async () => {
      const response = await api.get<Place>(`/places/${placeId}`);
      return response.data;
    },
  });

export const useGetPlaceReviews = (placeId: number) =>
  useQuery<Review[]>({
    queryKey: getGetPlaceReviewsQueryKey(placeId),
    queryFn: async () => {
      const response = await api.get<Review[]>(`/reviews/${placeId}`);
      return response.data;
    },
  });

export const useCreateReview = () =>
  useMutation({
    mutationFn: async (data: { userId: number; placeId: number; rating: number; comment: string }) => {
      const response = await api.post("/reviews", data);
      return response.data;
    },
  });

export const useAddFavorite = () =>
  useMutation({
    mutationFn: async (data: { userId: number; placeId: number }) => {
      const response = await api.post("/favorites", data);
      return response.data;
    },
  });

export const useAddPlaceToTrip = () =>
  useMutation({
    mutationFn: async (data: { tripId: number; placeId: number }) => {
      const response = await api.post(`/trips/${data.tripId}/places`, { placeId: data.placeId });
      return response.data;
    },
  });
