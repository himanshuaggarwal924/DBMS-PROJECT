import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Types
export interface Place {
  id: number;
  name: string;
  city: string;
  cityName?: string;
  type: string;
  rating: number;
  address: string;
  description: string;
  imageUrl?: string;
  category?: string;
  priceLevel?: number;
  tags?: string;
  reviewCount?: number;
}

export interface Review {
  id: number;
  user_id: number;
  place_id: number;
  rating: number;
  comment: string;
  userName?: string;
  created_at: string;
}

export interface Trip {
  id: number;
  user_id: number;
  name: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  places?: Place[];
  created_at: string;
}

// API functions
export const getPlace = async (id: number): Promise<Place> => {
  const response = await axios.get(`${API_BASE}/places/${id}`);
  return response.data;
};

export const getPlaceReviews = async (placeId: number): Promise<Review[]> => {
  const response = await axios.get(`${API_BASE}/reviews/${placeId}`);
  return response.data;
};

export const createReview = async (data: { userId: number; placeId: number; rating: number; comment: string }) => {
  const response = await axios.post(`${API_BASE}/reviews`, data);
  return response.data;
};

export const addFavorite = async (data: { userId: number; placeId: number }) => {
  const response = await axios.post(`${API_BASE}/favorites`, data);
  return response.data;
};

export const getTrips = async (userId: number): Promise<Trip[]> => {
  const response = await axios.get(`${API_BASE}/trips/${userId}`);
  return response.data;
};

export const addPlaceToTrip = async (data: { tripId: number; placeId: number }) => {
  // Assuming backend has this endpoint
  const response = await axios.post(`${API_BASE}/trips/${data.tripId}/places`, { placeId: data.placeId });
  return response.data;
};

// React Query hooks
export const useGetPlace = (id: number) => {
  return useQuery({
    queryKey: ['place', id],
    queryFn: () => getPlace(id),
    enabled: !!id,
  });
};

export const useGetPlaceReviews = (placeId: number) => {
  return useQuery({
    queryKey: ['reviews', placeId],
    queryFn: () => getPlaceReviews(placeId),
    enabled: !!placeId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

export const useGetTrips = (userId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: () => getTrips(userId),
    enabled: options?.enabled ?? !!userId,
  });
};

export const useAddPlaceToTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPlaceToTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

// Query keys
export const getGetPlaceQueryKey = (id: number) => ['place', id];
export const getGetPlaceReviewsQueryKey = (placeId: number) => ['reviews', placeId];