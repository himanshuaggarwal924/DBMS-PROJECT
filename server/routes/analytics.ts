import { Router, type IRouter } from "express";
import { query } from "../lib/mysql";

const router: IRouter = Router();

router.get("/popular-cities", async (req, res) => {
  try {
    const cities = await query(
      `SELECT id, name, country, search_count as searchCount
       FROM cities ORDER BY search_count DESC LIMIT 10`
    );
    res.json(cities);
  } catch (err) {
    console.error("Popular cities error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/top-rated", async (req, res) => {
  try {
    const { category } = req.query;
    const limitNum = Math.min(parseInt(req.query.limit as string) || 10, 50);

    let sql = `
      SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
             p.description, p.address, p.rating, p.price_level as priceLevel,
             p.image_url as imageUrl, p.tags, p.review_count as reviewCount
      FROM places p JOIN cities c ON c.id = p.city_id
      WHERE p.rating > 0`;
    const params: unknown[] = [];

    if (category) {
      sql += " AND p.category = ?";
      params.push(category);
    }

    sql += ` ORDER BY p.rating DESC, p.review_count DESC LIMIT ${limitNum}`;

    const places = await query(sql, params);
    res.json(places);
  } catch (err) {
    console.error("Top rated error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/recommendations", async (req, res) => {
  try {
    const { cityId } = req.query;
    const limitNum = Math.min(parseInt(req.query.limit as string) || 8, 50);

    let sql = `
      SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
             p.description, p.address, p.rating, p.price_level as priceLevel,
             p.image_url as imageUrl, p.tags, p.review_count as reviewCount
      FROM places p JOIN cities c ON c.id = p.city_id
      WHERE p.rating >= 4`;
    const params: unknown[] = [];

    if (cityId) {
      sql += " AND p.city_id = ?";
      params.push(parseInt(cityId as string));
    }

    sql += ` ORDER BY p.rating DESC LIMIT ${limitNum}`;

    const places = await query(sql, params);
    res.json(places);
  } catch (err) {
    console.error("Recommendations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
