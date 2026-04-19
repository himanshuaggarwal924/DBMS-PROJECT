/**
 * TripAdvisor16 on RapidAPI integration.
 *
 * Workflow for each city fetch:
 *   1. searchLocation  → get locationId
 *   2. searchHotels / searchRestaurants / searchAttractions  (parallel)
 *
 * All responses follow: { status: true, data: { data: [...] } }
 * or for location search: { status: true, data: [...] }
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

// ── TripAdvisor16 response shapes ────────────────────────────────

interface LocationResult {
  locationId?: number | string;
  locationName?: string;
  locationType?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  countryName?: string;
  streetAddress?: string | null;
}

interface LocationSearchResponse {
  status?: boolean;
  message?: string;
  data?: LocationResult[];
}

interface HotelItem {
  id?: string | number;
  title?: string;
  rating?: number | string;
  reviewsCount?: number;
  priceForDisplay?: string | null;
  priceDetails?: string | null;
  thumbnailUrl?: string;
  cardPhotos?: Array<{ sizes?: { urlTemplate?: string } }>;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface HotelsResponse {
  status?: boolean;
  data?: { data?: HotelItem[]; totalCount?: number };
}

interface RestaurantItem {
  restaurantsId?: string | number;
  restaurantName?: string;
  averageRating?: number | string;
  numberOfReviews?: number;
  priceLevel?: string; // "$", "$$", "$$$", "$$$$"
  priceTag?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  thumbnail?: {
    photoSizes?: Array<{ url?: string; urlTemplate?: string }>;
  };
  establishmentTypeAndCuisineTags?: Array<{ localizedName?: string }>;
}

interface RestaurantsResponse {
  status?: boolean;
  data?: { data?: RestaurantItem[]; totalRecords?: number };
}

interface AttractionItem {
  id?: string | number;
  title?: string;
  primaryInfo?: string;
  rating?: number | string;
  reviewsCount?: number;
  thumbnailUrl?: string;
  cardPhotos?: Array<{ sizes?: { urlTemplate?: string } }>;
  latitude?: number | string | null;
  longitude?: number | string | null;
  priceDetails?: string | null;
}

interface AttractionsResponse {
  status?: boolean;
  data?: { data?: AttractionItem[]; totalCount?: number };
}

// ── Configuration ─────────────────────────────────────────────────

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY  || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "tripadvisor16.p.rapidapi.com";
const CURRENCY_CODE = process.env.TRIPADVISOR_CURRENCY || "USD";

function ensureApiKey() {
  if (!RAPIDAPI_KEY.trim()) {
    throw new Error(
      'RAPIDAPI_KEY is not set. Add it to server/.env: RAPIDAPI_KEY=<your key>',
    );
  }
}

function headers() {
  ensureApiKey();
  return {
    "x-rapidapi-key":  RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type":    "application/json",
  };
}

const client = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}`,
  timeout: 30_000,
});

async function apiGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const response = await client.get<T>(path, { params, headers: headers() });
  return response.data;
}

// ── Utility helpers ───────────────────────────────────────────────

function toNum(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed  = Number(cleaned);
    return cleaned && Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toId(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

/**
 * Convert TripAdvisor price-level symbols to a rough USD cost.
 * "$"   → 25   "$$"  → 50   "$$$" → 100  "$$$$" → 200
 */
function priceLevelToUsd(level?: string | null): number | undefined {
  if (!level) return undefined;
  const dollarCount = (level.match(/\$/g) || []).length;
  if (dollarCount > 0) return dollarCount * 50;
  if (/free/i.test(level)) return 0;
  return toNum(level);
}

/**
 * Extract the best image URL from hotel/attraction responses.
 * cardPhotos urlTemplate uses {width} / {height} placeholders.
 */
function bestImage(
  thumbnailUrl?: string,
  cardPhotos?: Array<{ sizes?: { urlTemplate?: string } }>,
): string | undefined {
  if (thumbnailUrl?.startsWith("http")) return thumbnailUrl;
  const tmpl = cardPhotos?.[0]?.sizes?.urlTemplate;
  if (tmpl) return tmpl.replace("{width}", "600").replace("{height}", "400");
  return undefined;
}

/** Composite popularity: weighted rating + log(review count). */
function popScore(rating?: number, reviews?: number): number {
  return Math.round((rating ?? 0) * 20 + Math.log1p(reviews ?? 0) * 5);
}

/** YYYY-MM-DD offset from today — needed for the hotels endpoint. */
function futureDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

// ── Step 1 – resolve locationId from city name ────────────────────

interface ResolvedLocation {
  locationId: number;
  country: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Known Indian cities so we can provide a country fallback when the
 * API returns no countryName (rare, but possible for minor cities).
 */
const INDIAN_CITIES = new Set([
  "agra", "ahmedabad", "amritsar", "bangalore", "bengaluru", "bhopal",
  "chennai", "coimbatore", "delhi", "goa", "guwahati", "hyderabad",
  "indore", "jaipur", "kochi", "kolkata", "lucknow", "mumbai",
  "nagpur", "new delhi", "patna", "pune", "surat", "udaipur", "varanasi",
]);

function inferCountry(cityName: string): string {
  return INDIAN_CITIES.has(cityName.toLowerCase()) ? "India" : "Unknown";
}

async function resolveLocation(cityName: string): Promise<ResolvedLocation> {
  const rawResponse = await apiGet<unknown>(
    "/api/v1/hotels/searchLocation",
    { query: cityName },
  );

  console.log(`[RapidAPI] searchLocation raw response type: ${typeof rawResponse}, keys: ${rawResponse && typeof rawResponse === "object" ? Object.keys(rawResponse as object).join(", ") : "N/A"}`);
  console.log(`[RapidAPI] searchLocation snippet: ${JSON.stringify(rawResponse)?.slice(0, 400)}`);

  // The TripAdvisor16 searchLocation endpoint can return either:
  //   { status: true, data: [ LocationResult, ... ] }
  //   { status: true, data: { data: [ LocationResult, ... ] } }  (some API versions)
  // Handle both shapes.
  const body = rawResponse as Record<string, unknown>;
  let results: LocationResult[] = [];
  if (Array.isArray(body.data)) {
    results = body.data as LocationResult[];
  } else if (body.data && typeof body.data === "object" && Array.isArray((body.data as Record<string, unknown>).data)) {
    results = (body.data as { data: LocationResult[] }).data;
  }

  // Prefer an explicit CITY/GEO type; otherwise take the first non-hotel result
  const best =
    results.find((r) => r.locationType === "CITY" || r.locationType === "GEO") ??
    results.find((r) => !r.locationType?.toUpperCase().includes("HOTEL")) ??
    results[0];

  const locationId = toNum(best?.locationId);
  if (!locationId) {
    throw new Error(
      `TripAdvisor16: no locationId found for "${cityName}". Results: ${JSON.stringify(results.slice(0, 2))}`,
    );
  }

  return {
    locationId,
    country:   best?.countryName ?? inferCountry(cityName),
    latitude:  toNum(best?.latitude)  ?? undefined,
    longitude: toNum(best?.longitude) ?? undefined,
  };
}

// ── Normalise the { data: { data: [] } } vs { data: [] } shape ───

function extractItems<T>(body: unknown): T[] {
  if (!body || typeof body !== "object") return [];
  const b = body as Record<string, unknown>;
  // Shape A: { data: { data: [...] } }
  if (b.data && typeof b.data === "object" && Array.isArray((b.data as Record<string, unknown>).data)) {
    return (b.data as { data: T[] }).data;
  }
  // Shape B: { data: [...] }
  if (Array.isArray(b.data)) return b.data as T[];
  // Shape C: top-level array
  if (Array.isArray(b)) return b as T[];
  return [];
}

// ── Step 2a – Hotels ─────────────────────────────────────────────

async function fetchHotels(locationId: number): Promise<TravelPlace[]> {
  const response = await apiGet<unknown>(
    "/api/v1/hotels/searchHotels",
    {
      locationId,
      checkIn:      futureDate(30),
      checkOut:     futureDate(35),
      pageNumber:   1,
      currencyCode: CURRENCY_CODE,
    },
  );

  console.log(`[RapidAPI] Hotels raw snippet: ${JSON.stringify(response)?.slice(0, 300)}`);
  const items = extractItems<HotelItem>(response);
  console.log(`[RapidAPI] Hotels items extracted: ${items.length}`);

  return items
    .map((item): TravelPlace | null => {
      const id   = toId(item.id);
      const name = item.title?.trim();
      if (!id || !name) return null;

      const rating = toNum(item.rating);

      return {
        apiPlaceId:      `hotel_${id}`,
        name,
        avgCost:          toNum(item.priceForDisplay) ?? toNum(item.priceDetails),
        rating,
        latitude:         toNum(item.latitude),
        longitude:        toNum(item.longitude),
        category:         "Hotel",
        popularityScore:  popScore(rating, item.reviewsCount),
        imageUrl:         bestImage(item.thumbnailUrl, item.cardPhotos),
      };
    })
    .filter((p): p is TravelPlace => p !== null);
}

// ── Step 2b – Restaurants ────────────────────────────────────────

async function fetchRestaurants(locationId: number): Promise<TravelPlace[]> {
  const response = await apiGet<unknown>(
    "/api/v1/restaurant/searchRestaurants",
    { locationId },
  );

  console.log(`[RapidAPI] Restaurants raw snippet: ${JSON.stringify(response)?.slice(0, 300)}`);
  const items = extractItems<RestaurantItem>(response);
  console.log(`[RapidAPI] Restaurants items extracted: ${items.length}`);

  return items
    .map((item): TravelPlace | null => {
      const id   = toId(item.restaurantsId);
      const name = item.restaurantName?.trim();
      if (!id || !name) return null;

      const rating = toNum(item.averageRating);
      const cuisine = item.establishmentTypeAndCuisineTags?.[0]?.localizedName;

      // Thumbnail from nested photoSizes array
      const thumbUrl = item.thumbnail?.photoSizes?.[0]?.url;

      return {
        apiPlaceId:      `restaurant_${id}`,
        name,
        avgCost:          priceLevelToUsd(item.priceLevel),
        rating,
        latitude:         toNum(item.latitude),
        longitude:        toNum(item.longitude),
        category:         "Restaurant",
        popularityScore:  popScore(rating, item.numberOfReviews),
        description:      cuisine ? `Cuisine: ${cuisine}` : undefined,
        imageUrl:         thumbUrl,
      };
    })
    .filter((p): p is TravelPlace => p !== null);
}

// ── Step 2c – Attractions ────────────────────────────────────────

async function fetchAttractions(locationId: number): Promise<TravelPlace[]> {
  const response = await apiGet<unknown>(
    "/api/v1/attractions/searchAttractions",
    { locationId, currencyCode: CURRENCY_CODE },
  );

  console.log(`[RapidAPI] Attractions raw snippet: ${JSON.stringify(response)?.slice(0, 300)}`);
  const items = extractItems<AttractionItem>(response);
  console.log(`[RapidAPI] Attractions items extracted: ${items.length}`);

  return items
    .map((item): TravelPlace | null => {
      const id   = toId(item.id);
      const name = item.title?.trim();
      if (!id || !name) return null;

      const rating = toNum(item.rating);

      return {
        apiPlaceId:      `attraction_${id}`,
        name,
        avgCost:          priceLevelToUsd(item.priceDetails),
        rating,
        latitude:         toNum(item.latitude),
        longitude:        toNum(item.longitude),
        category:         "Attraction",
        popularityScore:  popScore(rating, item.reviewsCount),
        description:      item.primaryInfo ?? undefined,
        imageUrl:         bestImage(item.thumbnailUrl, item.cardPhotos),
      };
    })
    .filter((p): p is TravelPlace => p !== null);
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
      name:      cityName,
      country:   loc.country,
      latitude:  loc.latitude,
      longitude: loc.longitude,
    };
  } catch (err) {
    console.warn(
      `[RapidAPI] fetchCityInfo fallback for "${cityName}":`,
      err instanceof Error ? err.message : err,
    );
    return { name: cityName, country: inferCountry(cityName) };
  }
}

/**
 * Fetch hotels, restaurants, and attractions for a city from RapidAPI.
 *
 * Step 1 → searchLocation to get locationId
 * Step 2 → parallel fetches for all three categories
 * Individual category failures are logged but don't abort the whole call.
 */
export async function fetchPlacesFromRapidAPI(cityName: string): Promise<TravelPlace[]> {
  // Step 1 – get location ID
  const loc = await resolveLocation(cityName);
  console.log(`[RapidAPI] "${cityName}" → locationId=${loc.locationId} (${loc.country})`);

  // Step 2 – parallel fetch, tolerating individual failures
  const [hotelsResult, restaurantsResult, attractionsResult] = await Promise.allSettled([
    fetchHotels(loc.locationId),
    fetchRestaurants(loc.locationId),
    fetchAttractions(loc.locationId),
  ]);

  const all: TravelPlace[] = [];

  const results: Array<[string, PromiseSettledResult<TravelPlace[]>]> = [
    ["Hotels",      hotelsResult],
    ["Restaurants", restaurantsResult],
    ["Attractions", attractionsResult],
  ];

  for (const [label, result] of results) {
    if (result.status === "fulfilled") {
      console.log(`[RapidAPI] ${label}: ${result.value.length} results`);
      all.push(...result.value);
    } else {
      console.warn(
        `[RapidAPI] ${label} fetch failed:`,
        result.reason instanceof Error ? result.reason.message : result.reason,
      );
    }
  }

  const unique = dedupe(all);
  console.log(`[RapidAPI] Total unique places for "${cityName}": ${unique.length}`);
  return unique;
}
