import { Router, type IRouter } from "express";
import { query, insert } from "../lib/mysql";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { placeId, userId, rating, comment } = req.body;
    if (!placeId || !userId || !rating) {
      res.status(400).json({ message: "placeId, userId and rating are required" });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    await insert(
      "INSERT INTO reviews (place_id, user_id, rating, comment) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)",
      [placeId, userId, rating, comment || null]
    );

    await insert(
      `UPDATE places SET
        rating = (SELECT AVG(r.rating) FROM reviews r WHERE r.place_id = ?),
        review_count = (SELECT COUNT(*) FROM reviews r WHERE r.place_id = ?)
       WHERE id = ?`,
      [placeId, placeId, placeId]
    );

    const rows = await query(
      `SELECT r.id, r.place_id as placeId, r.user_id as userId, u.name as userName,
              r.rating, r.comment, r.created_at as createdAt
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.place_id = ? AND r.user_id = ?`,
      [placeId, userId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
