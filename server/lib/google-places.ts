/**
 * Google Places API integration for enriching place data.
 * 
 * Used for:
 *   - Place photos (high-quality images)
 *   - External ratings and review counts
 *   - Detailed place metadata
 * 
 * Complements OpenStreetMap for discovery and coordinates.
 */

import axios from "axios";

// ── Public types ─────────────────────────────────────────────────

export interface GooglePlaceData {
  placeId: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  address?: string;
  types?: string[];
}

// ── Configuration ─────────────────────────────────────────────────

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const NEARBY_SEARCH_BASE = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const PLACE_DETAILS_BASE = "https://maps.googleapis.com/maps/api/place/details/json";
const TEXT_SEARCH_BASE = "https://maps.googleapis.com/maps/api/place/textsearch/json";

// Rate limiting: 50 requests per second for standard tier
const REQUEST_DELAY_MS = 20;
let lastRequestTime = 0;

async function throttledRequest<T>(url: string, params: Record<string, unknown>): Promise<T> {
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();

  try {
    const response = await axios.get<T>(url, {
      params: { ...params, key: GOOGLE_API_KEY },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Google Places API error: ${error.response?.status} ${error.response?.data?.error_message || error.message}`
      );
    }
    throw error;
  }
}

// ── Utility helpers ───────────────────────────────────────────────

function toNum(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

// ── Enrich place with Google data ────────────────────────────────

export interface GoogleNearbyResult {
  place_id?: string;
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{ photo_reference?: string }>;
  formatted_address?: string;
  types?: string[];
  geometry?: {
    location?: { lat?: number; lng?: number };
  };
}

interface NearbySearchResponse {
  results?: GoogleNearbyResult[];
  status?: string;
  error_message?: string;
}

/**
 * Search for places near a location using Google Places Nearby Search.
 * Returns enriched data: ratings, reviews, photos.
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  placeName: string,
  radiusMeters = 5000
): Promise<GooglePlaceData[]> {
  try {
    const response = await throttledRequest<NearbySearchResponse>(NEARBY_SEARCH_BASE, {
      location: `${latitude},${longitude}`,
      radius: radiusMeters,
      keyword: placeName,
      type: "establishment",
    });

    if (response.status !== "OK") {
      console.warn(`[Google Places] Nearby search status: ${response.status}`);
      return [];
    }

    return (response.results || [])
      .slice(0, 5) // Top 5 results
      .map((place) => ({
        placeId: place.place_id || "",
        name: place.name || "",
        rating: toNum(place.rating),
        reviewCount: toNum(place.user_ratings_total),
        photoUrl: place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
          : undefined,
        address: place.formatted_address,
        types: place.types,
      }));
  } catch (error) {
    console.warn(`[Google Places] Nearby search failed:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Get detailed place information including photos and ratings.
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceData | null> {
  try {
    interface PlaceDetailsResponse {
      result?: {
        place_id?: string;
        name?: string;
        rating?: number;
        user_ratings_total?: number;
        photos?: Array<{ photo_reference?: string }>;
        formatted_address?: string;
        types?: string[];
      };
      status?: string;
      error_message?: string;
    }

    const response = await throttledRequest<PlaceDetailsResponse>(PLACE_DETAILS_BASE, {
      place_id: placeId,
      fields: "place_id,name,rating,user_ratings_total,photos,formatted_address,types",
    });

    if (response.status !== "OK" || !response.result) {
      return null;
    }

    const place = response.result;
    return {
      placeId: place.place_id || "",
      name: place.name || "",
      rating: toNum(place.rating),
      reviewCount: toNum(place.user_ratings_total),
      photoUrl: place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
        : undefined,
      address: place.formatted_address,
      types: place.types,
    };
  } catch (error) {
    console.warn(`[Google Places] Place details failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Text search for places (name + city).
 */
export async function textSearchPlace(
  placeName: string,
  cityName: string
): Promise<GooglePlaceData | null> {
  try {
    interface TextSearchResponse {
      results?: GoogleNearbyResult[];
      status?: string;
      error_message?: string;
    }

    const response = await throttledRequest<TextSearchResponse>(TEXT_SEARCH_BASE, {
      query: `${placeName} ${cityName}`,
    });

    if (response.status !== "OK" || !response.results || response.results.length === 0) {
      return null;
    }

    const place = response.results[0];
    return {
      placeId: place.place_id || "",
      name: place.name || "",
      rating: toNum(place.rating),
      reviewCount: toNum(place.user_ratings_total),
      photoUrl: place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
        : undefined,
      address: place.formatted_address,
      types: place.types,
    };
  } catch (error) {
    console.warn(`[Google Places] Text search failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Determine if a place matches Google's type filtering.
 */
export function isValidPlaceType(types: string[] | undefined, category: string): boolean {
  if (!types || types.length === 0) return true;

  const typeMap: Record<string, string[]> = {
    Hotel: ["lodging", "hotel", "inn", "vacation_rental", "campground"],
    Restaurant: ["restaurant", "cafe", "bakery", "meal_takeaway", "meal_delivery"],
    Attraction: [
      "tourist_attraction",
      "museum",
      "art_gallery",
      "park",
      "amusement_park",
      "zoo",
      "monument",
      "place_of_worship",
    ],
  };

  const expectedTypes = typeMap[category] || [];
  return types.some((t) => expectedTypes.includes(t));
}

export interface CityPlace {
  apiPlaceId: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  latitude: number;
  longitude: number;
  category: "Hotel" | "Restaurant" | "Attraction";
  popularityScore: number;
  imageUrl?: string;
  address?: string;
}

const CITY_CATEGORY_QUERIES: Array<{
  type: string;
  category: "Hotel" | "Restaurant" | "Attraction";
  radius: number;
}> = [
  { type: "lodging",            category: "Hotel",       radius: 15000 },
  { type: "restaurant",         category: "Restaurant",  radius: 5000  },
  { type: "tourist_attraction", category: "Attraction",  radius: 15000 },
];

function popScore(rating?: number, reviews?: number): number {
  return Math.round((rating ?? 0) * 20 + Math.log1p(reviews ?? 0) * 5);
}

/**
 * Fetch hotels, restaurants, and attractions for a city from Google Places
 * Nearby Search. Returns places with ratings, review counts, and photos.
 */
export async function fetchCityPlacesFromGoogle(
  latitude: number,
  longitude: number
): Promise<CityPlace[]> {
  const all: CityPlace[] = [];

  for (const q of CITY_CATEGORY_QUERIES) {
    try {
      const response = await throttledRequest<NearbySearchResponse>(NEARBY_SEARCH_BASE, {
        location: `${latitude},${longitude}`,
        radius: q.radius,
        type: q.type,
      });

      if (response.status !== "OK" && response.status !== "ZERO_RESULTS") {
        console.warn(`[Google Places] City fetch (${q.type}) status: ${response.status}`);
      }

      for (const place of response.results || []) {
        if (!place.place_id || !place.name) continue;
        const lat = toNum(place.geometry?.location?.lat);
        const lng = toNum(place.geometry?.location?.lng);
        if (lat == null || lng == null) continue;

        const rating = toNum(place.rating);
        const reviewCount = toNum(place.user_ratings_total);
        all.push({
          apiPlaceId: `google_${place.place_id}`,
          name: place.name,
          rating,
          reviewCount,
          latitude: lat,
          longitude: lng,
          category: q.category,
          popularityScore: popScore(rating, reviewCount),
          imageUrl: place.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
            : undefined,
          address: place.formatted_address,
        });
      }
    } catch (err) {
      console.warn(
        `[Google Places] City fetch failed for type "${q.type}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return all;
}

export { GOOGLE_API_KEY };
