import { Router, type IRouter } from "express";
import { query, insert } from "../lib/mysql";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    const places = await query(
      `SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
              p.description, p.address, p.rating, p.price_level as priceLevel,
              p.image_url as imageUrl, p.tags, p.review_count as reviewCount
       FROM favorites f
       JOIN places p ON p.id = f.place_id
       JOIN cities c ON c.id = p.city_id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(places);
  } catch (err) {
    console.error("Get favorites error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, placeId } = req.body;
    if (!userId || !placeId) {
      res.status(400).json({ message: "userId and placeId are required" });
      return;
    }

    await insert(
      "INSERT IGNORE INTO favorites (user_id, place_id) VALUES (?, ?)",
      [userId, placeId]
    );

    res.status(201).json({ success: true, message: "Added to favorites" });
  } catch (err) {
    console.error("Add favorite error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:placeId", async (req, res) => {
  try {
    const placeId = parseInt(req.params.placeId);
    const userId = parseInt(req.query.userId as string);

    await insert(
      "DELETE FROM favorites WHERE user_id = ? AND place_id = ?",
      [userId, placeId]
    );

    res.json({ success: true, message: "Removed from favorites" });
  } catch (err) {
    console.error("Remove favorite error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
