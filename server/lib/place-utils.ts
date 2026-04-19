import type { RowDataPacket } from "mysql2";
import { execute, queryOne, queryRows, type SqlValue } from "./mysql";
import { fetchCityInfo, fetchPlacesFromRapidAPI, type PlaceCategoryName, type TravelCity, type TravelPlace } from "./openstreetmap";
import {
  fetchCityPlacesFromGoogle,
  searchNearbyPlaces,
  textSearchPlace,
  type GooglePlaceData,
  GOOGLE_API_KEY,
} from "./google-places";

export type PlaceCategoryFilter = "hotel" | "restaurant" | "attraction";

export interface CityRow extends RowDataPacket {
  city_id: number;
  name: string;
  country: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  created_at?: string | Date;
}

export interface PlaceRow extends RowDataPacket {
  place_id: number;
  name: string;
  avg_cost?: number | string | null;
  rating?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  city_id: number;
  city_name: string;
  country?: string | null;
  category_name: PlaceCategoryName;
  api_place_id: string;
  popularity_score: number | string;
  description?: string | null;
  address?: string | null;
  image_url?: string | null;
  distance_km?: number | string | null;
  is_favorite?: number | boolean | null;
  google_place_id?: string | null;
  review_count?: number | string | null;
}

export const CATEGORY_NAME_TO_ID: Record<PlaceCategoryName, number> = {
  Hotel: 1,
  Restaurant: 2,
  Attraction: 3,
};

export function normalizeCategoryInput(value: unknown): PlaceCategoryFilter | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "hotel" || normalized === "restaurant" || normalized === "attraction") {
    return normalized;
  }

  return undefined;
}

export function categoryFilterToName(value?: PlaceCategoryFilter): PlaceCategoryName | undefined {
  if (value === "hotel") {
    return "Hotel";
  }
  if (value === "restaurant") {
    return "Restaurant";
  }
  if (value === "attraction") {
    return "Attraction";
  }
  return undefined;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function formatCity(city: CityRow) {
  return {
    id: city.city_id,
    name: city.name,
    country: city.country,
    latitude: toNumber(city.latitude) ?? null,
    longitude: toNumber(city.longitude) ?? null,
  };
}

export function formatPlace(place: PlaceRow) {
  const avgCost = toNumber(place.avg_cost) ?? null;
  const rating = toNumber(place.rating) ?? null;
  const distanceKm = toNumber(place.distance_km) ?? null;
  const reviewCount = toNumber(place.review_count) ?? 0;

  return {
    id: place.place_id,
    name: place.name,
    avgCost,
    priceLevel: avgCost,
    rating,
    latitude: toNumber(place.latitude) ?? null,
    longitude: toNumber(place.longitude) ?? null,
    cityId: place.city_id,
    cityName: place.city_name,
    country: place.country || null,
    category: place.category_name,
    type: place.category_name.toLowerCase(),
    apiPlaceId: place.api_place_id,
    popularityScore: toNumber(place.popularity_score) ?? 0,
    description: place.description || "",
    address: place.address || "",
    imageUrl: place.image_url || "",
    distanceKm,
    isFavorite: Boolean(place.is_favorite),
    googlePlaceId: place.google_place_id || null,
    reviewCount,
  };
}

export function buildDistanceExpression(latitudeColumn: string, longitudeColumn: string) {
  return `(
    6371 * ACOS(
      LEAST(
        1,
        GREATEST(
          -1,
          COS(RADIANS(?)) * COS(RADIANS(${latitudeColumn})) *
          COS(RADIANS(${longitudeColumn}) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(${latitudeColumn}))
        )
      )
    )
  )`;
}

export async function getCityById(cityId: number) {
  return queryOne<CityRow>(
    "SELECT city_id, name, country, latitude, longitude, created_at FROM cities WHERE city_id = ?",
    [cityId]
  );
}

export async function getCityByName(cityName: string) {
  return queryOne<CityRow>(
    "SELECT city_id, name, country, latitude, longitude, created_at FROM cities WHERE LOWER(name) = LOWER(?)",
    [cityName.trim()]
  );
}

async function insertCity(city: TravelCity) {
  const result = await execute(
    `INSERT INTO cities (name, country, latitude, longitude)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       country = VALUES(country),
       latitude = COALESCE(VALUES(latitude), latitude),
       longitude = COALESCE(VALUES(longitude), longitude)`,
    [city.name, city.country, city.latitude ?? null, city.longitude ?? null]
  );

  if (result.insertId) {
    return result.insertId;
  }

  const existingCity = await getCityByName(city.name);
  return existingCity?.city_id || 0;
}

export async function ensureCityExists(cityName: string) {
  if (cityName.trim().length < 3) {
    throw new Error(`City name too short: "${cityName}"`);
  }
  const existingCity = await getCityByName(cityName);
  if (existingCity) {
    return existingCity;
  }

  const liveCity = await fetchCityInfo(cityName);
  const cityId = await insertCity(liveCity);
  const city = await getCityById(cityId);

  if (!city) {
    throw new Error(`Failed to ensure city "${cityName}"`);
  }

  return city;
}

async function placeCountForCity(cityId: number) {
  const row = await queryOne<RowDataPacket & { total: number | string }>(
    "SELECT COUNT(*) AS total FROM places WHERE city_id = ?",
    [cityId]
  );

  return toNumber(row?.total) ?? 0;
}

async function ratedPlaceCountForCity(cityId: number) {
  const row = await queryOne<RowDataPacket & { total: number | string }>(
    "SELECT COUNT(*) AS total FROM places WHERE city_id = ? AND rating IS NOT NULL",
    [cityId]
  );
  return toNumber(row?.total) ?? 0;
}

async function getPlacesAsOsmFormat(cityId: number): Promise<TravelPlace[]> {
  const rows = await queryRows<PlaceRow[]>(
    `SELECT p.place_id, p.name, p.latitude, p.longitude, p.api_place_id,
            p.popularity_score, c.name AS category_name
     FROM places p
     JOIN categories c ON c.category_id = p.category_id
     WHERE p.city_id = ? AND p.rating IS NULL`,
    [cityId]
  );
  return rows.map((r) => ({
    apiPlaceId: r.api_place_id,
    name: r.name,
    latitude: toNumber(r.latitude),
    longitude: toNumber(r.longitude),
    category: r.category_name as PlaceCategoryName,
    popularityScore: toNumber(r.popularity_score) ?? 0,
  }));
}

async function upsertPlace(cityId: number, place: TravelPlace & { googlePlaceId?: string; reviewCount?: number }) {
  await execute(
    `INSERT INTO places (
       name,
       avg_cost,
       rating,
       latitude,
       longitude,
       city_id,
       category_id,
       api_place_id,
       popularity_score,
       description,
       address,
       image_url,
       google_place_id,
       review_count
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       avg_cost = VALUES(avg_cost),
       rating = VALUES(rating),
       latitude = COALESCE(VALUES(latitude), latitude),
       longitude = COALESCE(VALUES(longitude), longitude),
       city_id = VALUES(city_id),
       category_id = VALUES(category_id),
       popularity_score = GREATEST(popularity_score, VALUES(popularity_score)),
       description = COALESCE(VALUES(description), description),
       address = COALESCE(VALUES(address), address),
       image_url = COALESCE(VALUES(image_url), image_url),
       google_place_id = COALESCE(VALUES(google_place_id), google_place_id),
       review_count = COALESCE(VALUES(review_count), review_count)`,
    [
      place.name,
      place.avgCost ?? null,
      place.rating ?? null,
      place.latitude ?? null,
      place.longitude ?? null,
      cityId,
      CATEGORY_NAME_TO_ID[place.category],
      place.apiPlaceId,
      place.popularityScore,
      place.description ?? null,
      place.address ?? null,
      place.imageUrl ?? null,
      place.googlePlaceId ?? null,
      place.reviewCount ?? 0,
    ]
  );
}

export async function ensureCityPlacesCached(city: CityRow) {
  const totalPlaces = await placeCountForCity(city.city_id);

  // If coordinates are missing, resolve them now before any API call
  let cityLat = toNumber(city.latitude);
  let cityLon = toNumber(city.longitude);
  if ((cityLat == null || cityLon == null) && city.city_id) {
    try {
      const resolved = await fetchCityInfo(city.name);
      if (resolved.latitude != null && resolved.longitude != null) {
        cityLat = resolved.latitude;
        cityLon = resolved.longitude;
        await execute(
          "UPDATE cities SET latitude = ?, longitude = ?, country = COALESCE(NULLIF(country,'Unknown'), ?) WHERE city_id = ?",
          [cityLat, cityLon, resolved.country, city.city_id]
        );
        console.log(`[Cache] Resolved coords for "${city.name}": (${cityLat}, ${cityLon})`);
      }
    } catch (err) {
      console.warn(`[Cache] Could not resolve coords for "${city.name}":`, err instanceof Error ? err.message : err);
    }
  }

  if (totalPlaces > 0) {
    if (GOOGLE_API_KEY) {
      const rated = await ratedPlaceCountForCity(city.city_id);
      if (rated === 0) {
        getPlacesAsOsmFormat(city.city_id)
          .then((places) => enrichPlacesWithGoogle(city, places))
          .catch((err: unknown) =>
            console.warn(
              `[Google Enrich] Re-enrichment failed for "${city.name}":`,
              err instanceof Error ? err.message : err,
            )
          );
      }
    }
    return "database" as const;
  }

  // ── Try Google Places first (rated + photos from the start) ─────────────

  if (GOOGLE_API_KEY && cityLat != null && cityLon != null) {
    try {
      const googlePlaces = await fetchCityPlacesFromGoogle(cityLat, cityLon);
      console.log(`[Cache] Fetched ${googlePlaces.length} places for "${city.name}" from Google Places`);

      if (googlePlaces.length > 0) {
        let inserted = 0;
        for (const place of googlePlaces) {
          try {
            await upsertPlace(city.city_id, {
              apiPlaceId:      place.apiPlaceId,
              name:            place.name,
              rating:          place.rating,
              latitude:        place.latitude,
              longitude:       place.longitude,
              category:        place.category,
              popularityScore: place.popularityScore,
              imageUrl:        place.imageUrl,
              address:         place.address,
              googlePlaceId:   undefined,
              reviewCount:     place.reviewCount ?? 0,
            });
            inserted++;
          } catch (upsertErr) {
            console.warn(
              `[Cache] Failed to upsert Google place "${place.name}":`,
              upsertErr instanceof Error ? upsertErr.message : upsertErr,
            );
          }
        }
        console.log(`[Cache] Stored ${inserted}/${googlePlaces.length} Google places for "${city.name}"`);
        return "rapidapi" as const;
      }
    } catch (err) {
      console.warn(
        `[Cache] Google Places city fetch failed, falling back to OSM:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // ── Fallback: OSM + async Google enrichment ───────────────────────────────
  let livePlaces: TravelPlace[] = [];
  try {
    livePlaces = await fetchPlacesFromRapidAPI(city.name);
    console.log(`[Cache] Fetched ${livePlaces.length} places for "${city.name}" from OSM`);
  } catch (err) {
    console.error(
      `[Cache] OSM fetch failed for "${city.name}":`,
      err instanceof Error ? err.message : err,
    );
    return "rapidapi" as const;
  }

  let inserted = 0;
  for (const place of livePlaces) {
    try {
      await upsertPlace(city.city_id, { ...place, googlePlaceId: undefined, reviewCount: 0 });
      inserted++;
    } catch (upsertErr) {
      console.warn(
        `[Cache] Failed to upsert place "${place.name}" (${place.apiPlaceId}):`,
        upsertErr instanceof Error ? upsertErr.message : upsertErr,
      );
    }
  }
  console.log(`[Cache] Stored ${inserted}/${livePlaces.length} places for "${city.name}"`);

  if (GOOGLE_API_KEY) {
    enrichPlacesWithGoogle(city, livePlaces).catch((err: unknown) =>
      console.warn(
        `[Google Enrich] Pipeline failed for "${city.name}":`,
        err instanceof Error ? err.message : err,
      )
    );
  }

  return "rapidapi" as const;
}

const ENRICH_BATCH_SIZE = 5;
const ENRICH_BATCH_DELAY_MS = 300;

async function enrichSinglePlace(cityId: number, cityName: string, place: TravelPlace): Promise<void> {
  let googleData: GooglePlaceData | null = null;

  googleData = await textSearchPlace(place.name, cityName);

  if (!googleData && place.latitude != null && place.longitude != null) {
    const results = await searchNearbyPlaces(place.latitude, place.longitude, place.name, 100);
    googleData = results[0] ?? null;
  }

  if (!googleData) return;

  const rating = googleData.rating != null
    ? Math.min(5, Math.max(0, googleData.rating))
    : null;

  await execute(
    `UPDATE places SET
       rating          = COALESCE(?, rating),
       image_url       = COALESCE(?, image_url),
       google_place_id = COALESCE(?, google_place_id),
       review_count    = COALESCE(?, review_count)
     WHERE api_place_id = ? AND city_id = ?`,
    [
      rating,
      googleData.photoUrl ?? null,
      googleData.placeId || null,
      googleData.reviewCount ?? null,
      place.apiPlaceId,
      cityId,
    ]
  );
}

async function enrichPlacesWithGoogle(city: CityRow, places: TravelPlace[]): Promise<void> {
  console.log(`[Google Enrich] Starting enrichment for ${places.length} places in "${city.name}"`);
  let enriched = 0;

  for (let i = 0; i < places.length; i += ENRICH_BATCH_SIZE) {
    const batch = places.slice(i, i + ENRICH_BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(place => enrichSinglePlace(city.city_id, city.name, place))
    );

    results.forEach((r, j) => {
      if (r.status === "fulfilled") {
        enriched++;
      } else {
        console.warn(
          `[Google Enrich] Failed "${batch[j].name}":`,
          r.reason instanceof Error ? r.reason.message : r.reason,
        );
      }
    });

    if (i + ENRICH_BATCH_SIZE < places.length) {
      await new Promise(resolve => setTimeout(resolve, ENRICH_BATCH_DELAY_MS));
    }
  }

  console.log(`[Google Enrich] Completed: ${enriched}/${places.length} enriched for "${city.name}"`);
}

export async function logUserSearch(cityId: number, userId: number | null, searchParams: Record<string, unknown>) {
  try {
    await execute(
      "INSERT INTO user_searches (user_id, city_id, search_params) VALUES (?, ?, ?)",
      [userId, cityId, JSON.stringify(searchParams)]
    );
  } catch (err) {
    // Non-fatal — analytics logging must never break the main request
    console.warn("[logUserSearch] Failed to record search:", err instanceof Error ? err.message : err);
  }
}

export function buildPlaceFilterSql(
  filters: {
    category?: PlaceCategoryFilter;
    minRating?: number;
    minCost?: number;
    maxCost?: number;
  },
  alias = "p"
) {
  const clauses: string[] = [];
  const params: SqlValue[] = [];

  const categoryName = categoryFilterToName(filters.category);
  if (categoryName) {
    clauses.push(`c.name = ?`);
    params.push(categoryName);
  }

  if (typeof filters.minRating === "number") {
    clauses.push(`(${alias}.rating IS NULL OR ${alias}.rating >= ?)`);
    params.push(filters.minRating);
  }

  if (typeof filters.minCost === "number") {
    clauses.push(`${alias}.avg_cost >= ?`);
    params.push(filters.minCost);
  }

  if (typeof filters.maxCost === "number") {
    clauses.push(`${alias}.avg_cost <= ?`);
    params.push(filters.maxCost);
  }

  return { clauses, params };
}

export async function getPlaceById(placeId: number, userId?: number | null) {
  const favoriteSelect = userId ? "CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite" : "0 AS is_favorite";
  const favoriteJoin = userId ? "LEFT JOIN favorites f ON f.place_id = p.place_id AND f.user_id = ?" : "";
  const params: SqlValue[] = userId ? [userId, placeId] : [placeId];

  return queryOne<PlaceRow>(
    `SELECT
       p.place_id,
       p.name,
       p.avg_cost,
       p.rating,
       p.latitude,
       p.longitude,
       p.city_id,
       city.name AS city_name,
       city.country,
       c.name AS category_name,
       p.api_place_id,
       p.popularity_score,
       p.description,
       p.address,
       p.image_url,
       ${favoriteSelect}
     FROM places p
     JOIN cities city ON city.city_id = p.city_id
     JOIN categories c ON c.category_id = p.category_id
     ${favoriteJoin}
     WHERE p.place_id = ?`,
    params
  );
}

export async function getTopPlaces(limit = 8) {
  return queryRows<PlaceRow[]>(
    `SELECT
       p.place_id,
       p.name,
       p.avg_cost,
       p.rating,
       p.latitude,
       p.longitude,
       p.city_id,
       city.name AS city_name,
       city.country,
       c.name AS category_name,
       p.api_place_id,
       p.popularity_score,
       p.description,
       p.address,
       p.image_url,
       0 AS is_favorite
     FROM places p
     JOIN cities city ON city.city_id = p.city_id
     JOIN categories c ON c.category_id = p.category_id
     ORDER BY p.rating DESC, p.popularity_score DESC, p.place_id DESC
     LIMIT ?`,
    [limit]
  );
}
