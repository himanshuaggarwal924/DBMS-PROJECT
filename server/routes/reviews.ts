import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { execute, queryRows } from "../lib/mysql";

const router: IRouter = Router();

interface ReviewRow extends RowDataPacket {
  id: number;
  place_id: number;
  user_id: number;
  user_name: string;
  rating: number | string;
  comment?: string | null;
  created_at: string | Date;
}

function formatReview(review: ReviewRow) {
  return {
    id: review.id,
    placeId: review.place_id,
    userId: review.user_id,
    userName: review.user_name,
    rating: Number(review.rating),
    comment: review.comment || "",
    createdAt: review.created_at,
  };
}

router.get("/place/:placeId", async (req, res) => {
  try {
    const placeId = Number.parseInt(req.params.placeId, 10);
    if (!Number.isFinite(placeId)) {
      res.status(400).json({ message: "Valid placeId is required" });
      return;
    }

    const rows = await queryRows<ReviewRow[]>(
      `SELECT
         r.id,
         r.place_id,
         r.user_id,
         u.name AS user_name,
         r.rating,
         r.comment,
         r.created_at
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       WHERE r.place_id = ?
       ORDER BY r.created_at DESC`,
      [placeId]
    );

    res.json(rows.map(formatReview));
  } catch (error) {
    console.error("List reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { placeId, rating, comment } = req.body as {
      placeId?: number;
      rating?: number;
      comment?: string;
    };

    if (!placeId || typeof rating !== "number") {
      res.status(400).json({ message: "placeId and rating are required" });
      return;
    }

    if (rating < 0 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 0 and 5" });
      return;
    }

    await execute(
      `INSERT INTO reviews (user_id, place_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         comment = VALUES(comment),
         created_at = CURRENT_TIMESTAMP`,
      [req.auth!.userId, placeId, rating, comment || null]
    );

    const rows = await queryRows<ReviewRow[]>(
      `SELECT
         r.id,
         r.place_id,
         r.user_id,
         u.name AS user_name,
         r.rating,
         r.comment,
         r.created_at
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       WHERE r.place_id = ? AND r.user_id = ?`,
      [placeId, req.auth!.userId]
    );

    res.status(201).json(rows.length ? formatReview(rows[0]) : null);
  } catch (error) {
    console.error("Save review error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
