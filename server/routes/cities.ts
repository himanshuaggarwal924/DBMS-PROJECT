import { Router, type IRouter } from "express";
import { optionalAuth, type AuthenticatedRequest } from "../lib/auth";
import { getConnection, queryRows, withAdvisoryLock } from "../lib/mysql";
import {
  buildDistanceExpression,
  buildPlaceFilterSql,
  ensureCityExists,
  ensureCityPlacesCached,
  formatCity,
  formatPlace,
  getCityById,
  logUserSearch,
  normalizeCategoryInput,
  type CityRow,
  type PlaceRow,
} from "../lib/place-utils";

const router: IRouter = Router();

interface CityListRow extends CityRow {
  total_places?: number | string | null;
  average_rating?: number | string | null;
  search_count?: number | string | null;
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

function formatCitySummary(row: CityListRow) {
  return {
    ...formatCity(row),
    totalPlaces: toNumber(row.total_places) ?? 0,
    averageRating: toNumber(row.average_rating) ?? 0,
    searchCount: toNumber(row.search_count) ?? 0,
  };
}

function parseNumber(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

router.get("/", async (_req, res) => {
  try {
    const rows = await queryRows<CityListRow[]>(
      `SELECT
         city.city_id,
         city.name,
         city.country,
         city.latitude,
         city.longitude,
         city.created_at,
         COUNT(DISTINCT p.place_id) AS total_places,
         AVG(p.rating) AS average_rating,
         COUNT(DISTINCT us.id) AS search_count
       FROM cities city
       LEFT JOIN places p ON p.city_id = city.city_id
       LEFT JOIN user_searches us ON us.city_id = city.city_id
       GROUP BY city.city_id, city.name, city.country, city.latitude, city.longitude, city.created_at
       ORDER BY city.name ASC`
    );

    res.json(rows.map(formatCitySummary));
  } catch (error) {
    console.error("List cities error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/popular", async (_req, res) => {
  try {
    const rows = await queryRows<CityListRow[]>(
      `SELECT
         city.city_id,
         city.name,
         city.country,
         city.latitude,
         city.longitude,
         city.created_at,
         COUNT(DISTINCT p.place_id) AS total_places,
         AVG(p.rating) AS average_rating,
         COUNT(DISTINCT us.id) AS search_count
       FROM cities city
       LEFT JOIN places p ON p.city_id = city.city_id
       LEFT JOIN user_searches us ON us.city_id = city.city_id
       GROUP BY city.city_id, city.name, city.country, city.latitude, city.longitude, city.created_at
       ORDER BY search_count DESC, average_rating DESC, city.name ASC
       LIMIT 8`
    );

    res.json(rows.map(formatCitySummary));
  } catch (error) {
    console.error("Popular cities error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) {
      res.status(400).json({ message: "Query parameter q is required" });
      return;
    }
    if (query.length < 3) {
      res.json([]);
      return;
    }

    // Try the full query (with stats joins) first; fall back to a plain cities
    // lookup if user_searches or places don't exist yet.
    let rows: CityListRow[] = [];
    try {
      rows = await queryRows<CityListRow[]>(
        `SELECT
           city.city_id,
           city.name,
           city.country,
           city.latitude,
           city.longitude,
           city.created_at,
           COUNT(DISTINCT p.place_id) AS total_places,
           AVG(p.rating)              AS average_rating,
           COUNT(DISTINCT us.id)      AS search_count
         FROM cities city
         LEFT JOIN places p          ON p.city_id  = city.city_id
         LEFT JOIN user_searches us  ON us.city_id = city.city_id
         WHERE city.name LIKE ?
         GROUP BY city.city_id, city.name, city.country, city.latitude, city.longitude, city.created_at
         ORDER BY city.name ASC
         LIMIT 12`,
        [`%${query}%`]
      );
    } catch (sqlErr) {
      // Graceful degradation: stats join failed (e.g. table not yet created).
      // Try a minimal fallback query so the search still works.
      console.warn("[Search] Full query failed, trying fallback:", sqlErr instanceof Error ? sqlErr.message : sqlErr);
      try {
        rows = await queryRows<CityListRow[]>(
          `SELECT city_id, name, country, latitude, longitude, created_at
           FROM cities
           WHERE name LIKE ?
           ORDER BY name ASC
           LIMIT 12`,
          [`%${query}%`]
        );
      } catch (fallbackErr) {
        console.error("[Search] Fallback query also failed:", fallbackErr);
        throw fallbackErr; // re-throw so the outer catch returns 500
      }
    }

    if (rows.length === 0) {
      // City not cached — pull from RapidAPI and persist it
      try {
        const city = await withAdvisoryLock(
          `city_search_${query.toLowerCase().slice(0, 60)}`,
          30,
          () => ensureCityExists(query)
        );
        rows = [city];
      } catch (ensureErr) {
        console.error("[Search] ensureCityExists failed:", ensureErr instanceof Error ? ensureErr.message : ensureErr);
        // Return empty rather than 500 so the UI shows "No destinations found"
        res.json([]);
        return;
      }
    }

    res.json(rows.map(formatCitySummary));
  } catch (error) {
    console.error("Search cities error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:cityId/places", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const cityId = Number.parseInt(req.params.cityId, 10);
    if (!Number.isFinite(cityId)) {
      res.status(400).json({ message: "Valid cityId is required" });
      return;
    }

    const city = await getCityById(cityId);
    if (!city) {
      res.status(404).json({ message: "City not found" });
      return;
    }

    const source = await withAdvisoryLock(
      `city_places_${cityId}`,
      30,
      () => ensureCityPlacesCached(city)
    );

    const filters = {
      category: normalizeCategoryInput(req.query.category),
      minRating: parseNumber(req.query.minRating),
      minCost: parseNumber(req.query.minCost ?? req.query.minBudget),
      maxCost: parseNumber(req.query.maxCost ?? req.query.maxBudget),
    };

    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy.toLowerCase() : "rating";
    const refLat = parseNumber(req.query.refLat);
    const refLng = parseNumber(req.query.refLng);

    const distanceExpression = buildDistanceExpression("p.latitude", "p.longitude");
    const includeDistance = sortBy === "distance" && typeof refLat === "number" && typeof refLng === "number";

    const { clauses, params } = buildPlaceFilterSql(filters);
    const queryParams = includeDistance
      ? [refLat!, refLng!, refLat!, ...(req.auth?.userId ? [req.auth.userId] : []), cityId, ...params]
      : [...(req.auth?.userId ? [req.auth.userId] : []), cityId, ...params];

    const favoriteSelect = req.auth?.userId ? "CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite" : "0 AS is_favorite";
    const favoriteJoin = req.auth?.userId ? "LEFT JOIN favorites f ON f.place_id = p.place_id AND f.user_id = ?" : "";

    const rows = await queryRows<PlaceRow[]>(
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
         ${includeDistance ? `${distanceExpression} AS distance_km,` : "NULL AS distance_km,"}
         ${favoriteSelect}
       FROM places p
       JOIN cities city ON city.city_id = p.city_id
       JOIN categories c ON c.category_id = p.category_id
       ${favoriteJoin}
       WHERE p.city_id = ?
       ${clauses.length ? `AND ${clauses.join(" AND ")}` : ""}
       ORDER BY ${
         includeDistance
           ? "distance_km ASC, ISNULL(p.rating) ASC, p.rating DESC"
           : "ISNULL(p.rating) ASC, p.rating DESC, p.popularity_score DESC, p.place_id DESC"
       }`,
      queryParams
    );

    await logUserSearch(city.city_id, req.auth?.userId || null, {
      category: filters.category ?? null,
      minRating: filters.minRating ?? null,
      minCost: filters.minCost ?? null,
      maxCost: filters.maxCost ?? null,
      sortBy,
      refLat: refLat ?? null,
      refLng: refLng ?? null,
    });

    res.json({
      city: formatCity(city),
      source,
      places: rows.map(formatPlace),
    });
  } catch (error) {
    console.error("City places error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

interface BestValueRow {
  place_id: number;
  name: string;
  rating: number | string;
  avg_cost: number | string;
  category_name: string;
  city_name: string;
  value_score: number | string;
}

router.get("/:cityId/best-value", async (req, res) => {
  try {
    const cityId = Number.parseInt(req.params.cityId, 10);
    const limit = Math.min(Number.parseInt(String(req.query.limit || "10"), 10) || 10, 50);

    if (!Number.isFinite(cityId)) {
      res.status(400).json({ message: "Valid cityId is required" });
      return;
    }

    const conn = await getConnection();
    try {
      const [result] = await conn.query<never[]>("CALL GetBestValuePlaces(?, ?)", [cityId, limit]);
      const rows = (Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result) as BestValueRow[];

      res.json(
        rows.map((row) => ({
          placeId: row.place_id,
          name: row.name,
          rating: toNumber(row.rating) ?? null,
          avgCost: toNumber(row.avg_cost) ?? null,
          category: row.category_name,
          cityName: row.city_name,
          valueScore: toNumber(row.value_score) ?? 0,
        }))
      );
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Best value places error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
