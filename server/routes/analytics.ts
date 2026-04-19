import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2";
import { requireAdmin } from "../lib/auth";
import { queryOne, queryRows } from "../lib/mysql";

const router: IRouter = Router();

interface SummaryRow extends RowDataPacket {
  total_users: number | string;
  total_cities: number | string;
  total_places: number | string;
}

interface PopularCityRow extends RowDataPacket {
  city_name: string;
  search_count: number | string;
}

interface SavedPlaceRow extends RowDataPacket {
  place_id: number;
  place_name: string;
  save_count: number | string;
}

interface ActivityRow extends RowDataPacket {
  day: string | Date;
  active_users: number | string;
}

interface CityStatRow extends RowDataPacket {
  city_id: number;
  city_name: string;
  total_places: number | string;
  average_cost: number | string | null;
  most_common_category: string | null;
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

router.get("/admin/dashboard", requireAdmin, async (_req, res) => {
  try {
    const [summary, mostPopularCity, mostSavedPlace, userActivityLast7Days, cityWiseStats] = await Promise.all([
      queryOne<SummaryRow>(
        `SELECT
           (SELECT COUNT(*) FROM users) AS total_users,
           (SELECT COUNT(*) FROM cities) AS total_cities,
           (SELECT COUNT(*) FROM places) AS total_places`
      ),
      queryOne<PopularCityRow>(
        `SELECT city.name AS city_name, COUNT(us.id) AS search_count
         FROM user_searches us
         JOIN cities city ON city.city_id = us.city_id
         GROUP BY city.city_id, city.name
         ORDER BY search_count DESC, city.name ASC
         LIMIT 1`
      ),
      queryOne<SavedPlaceRow>(
        `SELECT p.place_id, p.name AS place_name, COUNT(f.id) AS save_count
         FROM favorites f
         JOIN places p ON p.place_id = f.place_id
         GROUP BY p.place_id, p.name
         ORDER BY save_count DESC, p.name ASC
         LIMIT 1`
      ),
      queryRows<ActivityRow[]>(
        `WITH RECURSIVE last_7_days AS (
           SELECT CURDATE() - INTERVAL 6 DAY AS day
           UNION ALL
           SELECT day + INTERVAL 1 DAY
           FROM last_7_days
           WHERE day < CURDATE()
         ),
         daily_activity AS (
           SELECT DATE(activity_date) AS activity_day, COUNT(DISTINCT user_id) AS active_users
           FROM (
             SELECT user_id, searched_at AS activity_date FROM user_searches WHERE user_id IS NOT NULL
             UNION ALL
             SELECT user_id, created_at AS activity_date FROM trips
             UNION ALL
             SELECT user_id, saved_at AS activity_date FROM favorites
             UNION ALL
             SELECT user_id, created_at AS activity_date FROM reviews
           ) activity
           WHERE activity_date >= CURDATE() - INTERVAL 6 DAY
           GROUP BY DATE(activity_date)
         )
         SELECT d.day, COALESCE(a.active_users, 0) AS active_users
         FROM last_7_days d
         LEFT JOIN daily_activity a ON a.activity_day = d.day
         ORDER BY d.day ASC`
      ),
      queryRows<CityStatRow[]>(
        `SELECT
           city.city_id,
           city.name AS city_name,
           COUNT(p.place_id) AS total_places,
           AVG(p.avg_cost) AS average_cost,
           (
             SELECT c2.name
             FROM places p2
             JOIN categories c2 ON c2.category_id = p2.category_id
             WHERE p2.city_id = city.city_id
             GROUP BY c2.name
             ORDER BY COUNT(*) DESC, c2.name ASC
             LIMIT 1
           ) AS most_common_category
         FROM cities city
         LEFT JOIN places p ON p.city_id = city.city_id
         GROUP BY city.city_id, city.name
         ORDER BY total_places DESC, city.name ASC`
      ),
    ]);

    res.json({
      summary: {
        totalUsers: toNumber(summary?.total_users) ?? 0,
        totalCities: toNumber(summary?.total_cities) ?? 0,
        totalPlaces: toNumber(summary?.total_places) ?? 0,
      },
      mostPopularCity: mostPopularCity
        ? {
            cityName: mostPopularCity.city_name,
            searchCount: toNumber(mostPopularCity.search_count) ?? 0,
          }
        : null,
      mostSavedPlace: mostSavedPlace
        ? {
            placeId: mostSavedPlace.place_id,
            placeName: mostSavedPlace.place_name,
            saveCount: toNumber(mostSavedPlace.save_count) ?? 0,
          }
        : null,
      userActivityLast7Days: userActivityLast7Days.map((row) => ({
        day: row.day,
        activeUsers: toNumber(row.active_users) ?? 0,
      })),
      cityWiseStats: cityWiseStats.map((row) => ({
        cityId: row.city_id,
        cityName: row.city_name,
        totalPlaces: toNumber(row.total_places) ?? 0,
        averageCost: toNumber(row.average_cost) ?? 0,
        mostCommonCategory: row.most_common_category || "N/A",
      })),
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
