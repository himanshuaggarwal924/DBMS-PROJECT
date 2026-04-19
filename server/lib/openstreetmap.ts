/**
 * OpenStreetMap integration using Nominatim (geocoding) and Overpass API (place queries).
 * 
 * Workflow for each city fetch:
 *   1. Nominatim searchLocation → get city coordinates and country
 *   2. Overpass queries for hotels, restaurants, attractions (parallel)
 * 
 * Completely free, no API key required, unlimited requests.
 */

import axios from "axios";

// ── Public types ─────────────────────────────────────────────────

export type PlaceCategoryName = "Hotel" | "Restaurant" | "Attraction";

export interface TravelCity {
  name: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface TravelPlace {
  apiPlaceId: string;
  name: string;
  avgCost?: number;
  rating?: number;
  latitude?: number;
  longitude?: number;
  category: PlaceCategoryName;
  popularityScore: number;
  description?: string;
  address?: string;
  imageUrl?: string;
}

// ── Configuration ─────────────────────────────────────────────────

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OVERPASS_BASE = "https://overpass-api.de/api/interpreter";

// Throttle to respect rate limits (Nominatim: 1 req/sec, Overpass: reasonable use)
const REQUEST_DELAY_MS = 500;
let lastRequestTime = 0;

async function throttledRequest<T>(url: string, params?: Record<string, string | number>): Promise<T> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();

  try {
    const response = await axios.get<T>(url, {
      params,
      timeout: 15000,
      headers: {
        "User-Agent": "WanderSync-TravelPlanner/1.0 (https://github.com/user/travel-planner)",
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `OpenStreetMap API error: ${error.response?.status} ${error.message}`
      );
    }
    throw error;
  }
}

// ── Utility helpers ───────────────────────────────────────────────

function toNum(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return cleaned && Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toId(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

/** Composite popularity: weighted rating + log(review count). */
function popScore(rating?: number, reviews?: number): number {
  return Math.round((rating ?? 0) * 20 + Math.log1p(reviews ?? 0) * 5);
}

// ── Step 1 – Resolve city location using Nominatim ────────────────

interface NominatimResult {
  place_id?: number;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
  importance?: number;
}

interface ResolvedLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  boundingBox?: { south: number; north: number; west: number; east: number };
}

async function resolveLocation(cityName: string): Promise<ResolvedLocation> {
  const results = await throttledRequest<NominatimResult[]>(`${NOMINATIM_BASE}/search`, {
    q: cityName,
    format: "json",
    addressdetails: 1,
    limit: "5",
  });

  if (!results || results.length === 0) {
    throw new Error(`OpenStreetMap: No results found for "${cityName}"`);
  }

  // Prefer results with city/town type, otherwise take first
  const best = results.find((r) => {
    const addr = r.address;
    return addr?.city || addr?.town;
  }) || results[0];

  const lat = toNum(best?.lat);
  const lon = toNum(best?.lon);

  if (!lat || !lon) {
    throw new Error(
      `OpenStreetMap: Invalid coordinates for "${cityName}". Results: ${JSON.stringify(
        results.slice(0, 1)
      )}`
    );
  }

  const country = best?.address?.country || "Unknown";
  const bbox = best?.boundingbox
    ? {
        south: toNum(best.boundingbox[0]) || 0,
        north: toNum(best.boundingbox[1]) || 0,
        west: toNum(best.boundingbox[2]) || 0,
        east: toNum(best.boundingbox[3]) || 0,
      }
    : undefined;

  return {
    city: cityName,
    country,
    latitude: lat,
    longitude: lon,
    boundingBox: bbox,
  };
}

// ── Step 2 – Query Nominatim for places within a city ──────────

async function queryNominatimForPlaces(
  cityName: string,
  amenityType: string
): Promise<TravelPlace[]> {
  try {
    // Use Nominatim to search for specific amenities in a city
    const results = await throttledRequest<NominatimResult[]>(`${NOMINATIM_BASE}/search`, {
      q: `${amenityType} in ${cityName}`,
      format: "json",
      limit: "50",
      addressdetails: "1",
    });

    if (!results || results.length === 0) return [];

    return results
      .map((result, idx): TravelPlace | null => {
        const lat = toNum(result.lat);
        const lon = toNum(result.lon);
        const placeId = toId(result.place_id);

        if (!lat || !lon || !placeId) return null;

        const name = result.name || result.address?.city;
        if (!name) return null;

        return {
          apiPlaceId: `osm_${placeId}`,
          name,
          latitude: lat,
          longitude: lon,
          category: "Hotel", // Will be overridden by caller
          popularityScore: Math.round((result.importance || 0) * 100),
          address: result.display_name,
        };
      })
      .filter((p): p is TravelPlace => p !== null);
  } catch (error) {
    console.warn(
      `[OpenStreetMap] Nominatim search for "${amenityType}" failed:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

// ── Step 2a – Hotels ────────────────────────────────────────────

async function fetchHotels(cityName: string): Promise<TravelPlace[]> {
  const places = await queryNominatimForPlaces(cityName, "hotel");
  console.log(`[OpenStreetMap] Hotels: ${places.length} results`);

  return places.map((p) => ({
    ...p,
    category: "Hotel" as const,
  }));
}

// ── Step 2b – Restaurants ──────────────────────────────────────

async function fetchRestaurants(cityName: string): Promise<TravelPlace[]> {
  const places = await queryNominatimForPlaces(cityName, "restaurant");
  console.log(`[OpenStreetMap] Restaurants: ${places.length} results`);

  return places.map((p) => ({
    ...p,
    category: "Restaurant" as const,
  }));
}

// ── Step 2c – Attractions ──────────────────────────────────────

async function fetchAttractions(cityName: string): Promise<TravelPlace[]> {
  const places = await queryNominatimForPlaces(cityName, "attraction");
  console.log(`[OpenStreetMap] Attractions: ${places.length} results`);

  return places.map((p) => ({
    ...p,
    category: "Attraction" as const,
  }));
}

// ── Deduplicate by apiPlaceId ─────────────────────────────────────

function dedupe(places: TravelPlace[]): TravelPlace[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (seen.has(p.apiPlaceId)) return false;
    seen.add(p.apiPlaceId);
    return true;
  });
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Fetch basic city metadata (name, country, coordinates).
 * Falls back gracefully if the API call fails.
 */
export async function fetchCityInfo(cityName: string): Promise<TravelCity> {
  try {
    const loc = await resolveLocation(cityName);
    return {
      name: loc.city,
      country: loc.country,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
  } catch (err) {
    console.warn(
      `[OpenStreetMap] fetchCityInfo fallback for "${cityName}":`,
      err instanceof Error ? err.message : err
    );
    return { name: cityName, country: "Unknown" };
  }
}

/**
 * Fetch hotels, restaurants, and attractions for a city from OpenStreetMap.
 *
 * Step 1 → Nominatim to get city coordinates
 * Step 2 → parallel Nominatim queries for all three categories
 * Individual category failures are logged but don't abort the whole call.
 */
export async function fetchPlacesFromRapidAPI(cityName: string): Promise<TravelPlace[]> {
  // Step 1 – verify city exists (just for logging)
  let location: ResolvedLocation;
  try {
    location = await resolveLocation(cityName);
    console.log(
      `[OpenStreetMap] "${cityName}" → coords=(${location.latitude.toFixed(
        2
      )},${location.longitude.toFixed(2)}) (${location.country})`
    );
  } catch (err) {
    console.error(
      "[OpenStreetMap] Location resolution failed:",
      err instanceof Error ? err.message : err
    );
    throw err;
  }

  // Step 2 – parallel fetch, tolerating individual failures
  const [hotelsResult, restaurantsResult, attractionsResult] = await Promise.allSettled([
    fetchHotels(cityName),
    fetchRestaurants(cityName),
    fetchAttractions(cityName),
  ]);

  const all: TravelPlace[] = [];

  const results: Array<[string, PromiseSettledResult<TravelPlace[]>]> = [
    ["Hotels", hotelsResult],
    ["Restaurants", restaurantsResult],
    ["Attractions", attractionsResult],
  ];

  for (const [label, result] of results) {
    if (result.status === "fulfilled") {
      console.log(`[OpenStreetMap] ${label}: ${result.value.length} results`);
      all.push(...result.value);
    } else {
      console.warn(
        `[OpenStreetMap] ${label} fetch failed:`,
        result.reason instanceof Error ? result.reason.message : result.reason
      );
    }
  }

  const unique = dedupe(all);
  console.log(`[OpenStreetMap] Total unique places for "${cityName}": ${unique.length}`);
  return unique;
}
