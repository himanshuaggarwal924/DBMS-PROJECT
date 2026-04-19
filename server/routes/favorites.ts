import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { execute, queryOne, queryRows, withTransaction } from "../lib/mysql";
import { formatPlace, type PlaceRow } from "../lib/place-utils";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
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
         1 AS is_favorite
       FROM favorites f
       JOIN places p ON p.place_id = f.place_id
       JOIN cities city ON city.city_id = p.city_id
       JOIN categories c ON c.category_id = p.category_id
       WHERE f.user_id = ?
       ORDER BY f.saved_at DESC`,
      [req.auth!.userId]
    );

    res.json(rows.map(formatPlace));
  } catch (error) {
    console.error("List favorites error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:placeId", async (req: AuthenticatedRequest, res) => {
  try {
    const placeId = Number.parseInt(req.params.placeId, 10);
    if (!Number.isFinite(placeId)) {
      res.status(400).json({ message: "Valid placeId is required" });
      return;
    }

    const result = await execute(
      "INSERT IGNORE INTO favorites (user_id, place_id) VALUES (?, ?)",
      [req.auth!.userId, placeId]
    );
    if (result.affectedRows > 0) {
      await withTransaction(async (conn) => {
        await conn.execute("SELECT place_id FROM places WHERE place_id = ? FOR UPDATE", [placeId]);
        await conn.execute(
          "UPDATE places SET popularity_score = popularity_score + 1 WHERE place_id = ?",
          [placeId]
        );
      });
    }

    const favorite = await queryOne<RowDataPacket & { id: number }>(
      "SELECT id FROM favorites WHERE user_id = ? AND place_id = ?",
      [req.auth!.userId, placeId]
    );

    res.status(201).json({ success: true, id: favorite?.id || null });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:placeId", async (req: AuthenticatedRequest, res) => {
  try {
    const placeId = Number.parseInt(req.params.placeId, 10);
    if (!Number.isFinite(placeId)) {
      res.status(400).json({ message: "Valid placeId is required" });
      return;
    }

    await execute(
      "DELETE FROM favorites WHERE user_id = ? AND place_id = ?",
      [req.auth!.userId, placeId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
