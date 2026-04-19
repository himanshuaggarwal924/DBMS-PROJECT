import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2";
import { optionalAuth, type AuthenticatedRequest } from "../lib/auth";
import { queryOne, queryRows, type SqlValue } from "../lib/mysql";
import {
  buildDistanceExpression,
  buildPlaceFilterSql,
  ensureCityExists,
  ensureCityPlacesCached,
  formatPlace,
  getPlaceById,
  getTopPlaces,
  logUserSearch,
  normalizeCategoryInput,
  type PlaceRow,
} from "../lib/place-utils";

const router: IRouter = Router();

interface CategoryPreferenceRow extends RowDataPacket {
  category_name: string;
}

interface SavedTogetherRow extends PlaceRow {
  saved_together_count: number | string;
}

function parseNumber(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

router.get("/top", async (req, res) => {
  try {
    const limit = Math.min(Number.parseInt(String(req.query.limit || "8"), 10) || 8, 20);
    const rows = await getTopPlaces(limit);
    res.json(rows.map(formatPlace));
  } catch (error) {
    console.error("Top places error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/recommendations", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = Math.min(Number.parseInt(String(req.query.limit || "8"), 10) || 8, 20);
    const preferenceUserId = req.auth?.userId || (parseNumber(req.query.userId) ?? null);

    let preferredCategories: string[] = [];
    if (preferenceUserId) {
      const categoryRows = await queryRows<CategoryPreferenceRow[]>(
        `SELECT DISTINCT c.name AS category_name
         FROM favorites f
         JOIN places p ON p.place_id = f.place_id
         JOIN categories c ON c.category_id = p.category_id
         WHERE f.user_id = ?
         UNION
         SELECT DISTINCT c.name AS category_name
         FROM reviews r
         JOIN places p ON p.place_id = r.place_id
         JOIN categories c ON c.category_id = p.category_id
         WHERE r.user_id = ? AND r.rating >= 4`,
        [preferenceUserId, preferenceUserId]
      );

      preferredCategories = categoryRows.map((row) => row.category_name).filter(Boolean);
    }

    const placeholders = preferredCategories.map(() => "?").join(", ");
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
         0 AS is_favorite
       FROM places p
       JOIN cities city ON city.city_id = p.city_id
       JOIN categories c ON c.category_id = p.category_id
       WHERE 1 = 1
       ${preferredCategories.length ? `AND c.name IN (${placeholders})` : ""}
       ORDER BY p.popularity_score DESC, p.rating DESC, p.place_id DESC
       LIMIT ?`,
      [...preferredCategories, limit]
    );

    res.json(rows.map(formatPlace));
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/city/:cityName", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const cityName = req.params.cityName.trim();
    if (!cityName) {
      res.status(400).json({ message: "City name is required" });
      return;
    }

    const city = await ensureCityExists(cityName);
    const source = await ensureCityPlacesCached(city);

    const filters = {
      category: normalizeCategoryInput(req.query.category),
      minRating: parseNumber(req.query.minRating),
      minCost: parseNumber(req.query.minCost ?? req.query.minBudget),
      maxCost: parseNumber(req.query.maxCost ?? req.query.maxBudget),
    };
    const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy.toLowerCase() : "rating";
    const refLat = parseNumber(req.query.refLat);
    const refLng = parseNumber(req.query.refLng);
    const includeDistance = sortBy === "distance" && typeof refLat === "number" && typeof refLng === "number";

    const distanceExpression = buildDistanceExpression("p.latitude", "p.longitude");
    const { clauses, params } = buildPlaceFilterSql(filters);
    const favoriteSelect = req.auth?.userId ? "CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite" : "0 AS is_favorite";
    const favoriteJoin = req.auth?.userId ? "LEFT JOIN favorites f ON f.place_id = p.place_id AND f.user_id = ?" : "";

    const queryParams: SqlValue[] = includeDistance
      ? [refLat!, refLng!, refLat!, ...(req.auth?.userId ? [req.auth.userId] : []), city.city_id, ...params]
      : [...(req.auth?.userId ? [req.auth.userId] : []), city.city_id, ...params];

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
       AND p.rating IS NOT NULL
       ${clauses.length ? `AND ${clauses.join(" AND ")}` : ""}
       ORDER BY ${
         includeDistance
           ? "distance_km ASC, p.rating DESC"
           : "p.rating DESC, p.popularity_score DESC, p.place_id DESC"
       }`,
      queryParams
    );

    await logUserSearch(city.city_id, req.auth?.userId || null, {
      cityName,
      category: filters.category ?? null,
      minRating: filters.minRating ?? null,
      minCost: filters.minCost ?? null,
      maxCost: filters.maxCost ?? null,
      sortBy,
      refLat: refLat ?? null,
      refLng: refLng ?? null,
    });

    res.json({
      city: {
        id: city.city_id,
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
      },
      source,
      places: rows.map(formatPlace),
    });
  } catch (error) {
    console.error("City places by name error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:placeId/saved-together", async (req, res) => {
  try {
    const placeId = Number.parseInt(req.params.placeId, 10);
    if (!Number.isFinite(placeId)) {
      res.status(400).json({ message: "Valid placeId is required" });
      return;
    }

    const rows = await queryRows<SavedTogetherRow[]>(
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
         0 AS is_favorite,
         COUNT(*) AS saved_together_count
       FROM favorites f1
       JOIN favorites f2 ON f1.user_id = f2.user_id AND f1.place_id <> f2.place_id
       JOIN places p ON p.place_id = f2.place_id
       JOIN cities city ON city.city_id = p.city_id
       JOIN categories c ON c.category_id = p.category_id
       WHERE f1.place_id = ?
       GROUP BY
         p.place_id,
         p.name,
         p.avg_cost,
         p.rating,
         p.latitude,
         p.longitude,
         p.city_id,
         city.name,
         city.country,
         c.name,
         p.api_place_id,
         p.popularity_score,
         p.description,
         p.address,
         p.image_url
       ORDER BY saved_together_count DESC, p.rating DESC
       LIMIT 6`,
      [placeId]
    );

    res.json(
      rows.map((row) => ({
        ...formatPlace(row),
        savedTogetherCount: Number(row.saved_together_count),
      }))
    );
  } catch (error) {
    console.error("Saved together recommendations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:placeId/details", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const placeId = Number.parseInt(req.params.placeId, 10);
    if (!Number.isFinite(placeId)) {
      res.status(400).json({ message: "Valid placeId is required" });
      return;
    }

    const place = await getPlaceById(placeId, req.auth?.userId);
    if (!place) {
      res.status(404).json({ message: "Place not found" });
      return;
    }

    const reviewSummary = await queryOne<RowDataPacket & { total_reviews: number | string; average_rating: number | string }>(
      `SELECT COUNT(*) AS total_reviews, AVG(rating) AS average_rating
       FROM reviews
       WHERE place_id = ?`,
      [placeId]
    );

    res.json({
      ...formatPlace(place),
      localReviewCount: Number(reviewSummary?.total_reviews || 0),
      localReviewAverage: reviewSummary?.average_rating ? Number(reviewSummary.average_rating) : null,
    });
  } catch (error) {
    console.error("Place detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:placeId", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const placeId = Number.parseInt(req.params.placeId, 10);
    if (!Number.isFinite(placeId)) {
      res.status(400).json({ message: "Valid placeId is required" });
      return;
    }

    const place = await getPlaceById(placeId, req.auth?.userId);
    if (!place) {
      res.status(404).json({ message: "Place not found" });
      return;
    }

    res.json(formatPlace(place));
  } catch (error) {
    console.error("Get place error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
