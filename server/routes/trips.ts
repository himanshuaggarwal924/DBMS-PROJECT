import { Router, type IRouter } from "express";
import { query, queryOne, insert } from "../lib/mysql";
import type { RowDataPacket } from "mysql2";

interface Trip extends RowDataPacket {
  id: number;
  userId: number;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
}

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    const trips = await query<Trip[]>(
      `SELECT t.id, t.user_id as userId, t.title, t.city_id as cityId,
              c.name as cityName, t.start_date as startDate, t.end_date as endDate, t.created_at as createdAt
       FROM trips t LEFT JOIN cities c ON c.id = t.city_id
       WHERE t.user_id = ? ORDER BY t.created_at DESC`,
      [userId]
    );

    const tripsWithPlaces = await Promise.all(
      trips.map(async (trip: Trip) => {
        const places = await query(
          `SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
                  p.description, p.address, p.rating, p.price_level as priceLevel,
                  p.image_url as imageUrl, p.tags, p.review_count as reviewCount
           FROM trip_places tp
           JOIN places p ON p.id = tp.place_id
           JOIN cities c ON c.id = p.city_id
           WHERE tp.trip_id = ?`,
          [trip.id]
        );
        return { ...trip, places };
      })
    );

    res.json(tripsWithPlaces);
  } catch (err) {
    console.error("Get trips error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, title, cityId, startDate, endDate } = req.body;
    if (!userId || !title) {
      res.status(400).json({ message: "userId and title are required" });
      return;
    }

    const result = await insert(
      "INSERT INTO trips (user_id, title, city_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
      [userId, title, cityId || null, startDate || null, endDate || null]
    );

    const trip = await queryOne(
      `SELECT t.id, t.user_id as userId, t.title, t.city_id as cityId,
              c.name as cityName, t.start_date as startDate, t.end_date as endDate, t.created_at as createdAt
       FROM trips t LEFT JOIN cities c ON c.id = t.city_id
       WHERE t.id = ?`,
      [result]
    );

    res.status(201).json({ ...(trip as object), places: [] });
  } catch (err) {
    console.error("Create trip error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:tripId/places", async (req, res) => {
  try {
    const tripId = parseInt(req.params.tripId);
    const { placeId } = req.body;

    await insert(
      "INSERT IGNORE INTO trip_places (trip_id, place_id) VALUES (?, ?)",
      [tripId, placeId]
    );

    res.status(201).json({ success: true, message: "Place added to trip" });
  } catch (err) {
    console.error("Add place to trip error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
