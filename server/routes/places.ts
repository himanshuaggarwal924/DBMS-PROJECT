import { Router, type IRouter } from "express";
import { query } from "../lib/mysql";
import { fetchPlacesFromRapidAPI, generatePlacesForCity } from "../lib/rapidapi";

const router: IRouter = Router();

// Helper function to normalize place data types
function normalizePlace(place: any) {
  return {
    ...place,
    rating: place.rating ? parseFloat(place.rating) : null,
    priceLevel: place.priceLevel ? parseInt(place.priceLevel) : null,
    cityId: place.cityId ? parseInt(place.cityId) : null,
    reviewCount: place.reviewCount ? parseInt(place.reviewCount) : 0,
  };
}

function normalizePlaces(places: any[]) {
  return places.map(normalizePlace);
}

// Get places by city name (supports ANY city, not just database entries)
router.get("/city/:cityName", async (req, res) => {
  try {
    const cityName = req.params.cityName as string;
    const category = req.query.category as string || undefined;

    // Generate places for the city
    let places = generatePlacesForCity(cityName);

    // Filter by category if provided
    if (category) {
      places = places.filter(p => p.type === category);
    }

    // Normalize the data
    res.json(normalizePlaces(places));
  } catch (err) {
    console.error("Get city places error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get top-rated places
router.get("/top", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    let places = await query(
      `SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
              p.description, p.address, p.rating, p.price_level as priceLevel,
              p.image_url as imageUrl, p.tags, p.review_count as reviewCount
       FROM places p
       LEFT JOIN cities c ON c.id = p.city_id
       ORDER BY p.rating DESC LIMIT ?`,
      [limit]
    );

    // If no places in database, fetch from RapidAPI
    if (places.length === 0) {
      const mockPlaces = await fetchPlacesFromRapidAPI("New York", "hotel");
      type PlaceType = { id: string | number; name: string; type: string; rating?: number; description?: string; address?: string; price?: number; imageUrl?: string };
      places = mockPlaces.slice(0, limit).map((p: PlaceType) => ({
        id: String(p.id),
        cityId: null,
        cityName: "New York",
        name: p.name,
        category: p.type,
        description: p.description,
        address: p.address,
        rating: p.rating,
        priceLevel: p.price,
        imageUrl: p.imageUrl,
        tags: null,
        reviewCount: 0,
      })) as unknown as typeof places
    }

    res.json(normalizePlaces(places));
  } catch (err) {
    console.error("Get top places error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recommendations (can be personalized based on userId if needed)
router.get("/recommendations", async (req, res) => {
  try {
    // userId can be used for personalization in future
    let places = await query(
      `SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
              p.description, p.address, p.rating, p.price_level as priceLevel,
              p.image_url as imageUrl, p.tags, p.review_count as reviewCount
       FROM places p
       LEFT JOIN cities c ON c.id = p.city_id
       ORDER BY p.rating DESC, p.review_count DESC LIMIT 8`
    );

    // If no recommendations, fetch from RapidAPI
    if (places.length === 0) {
      const mockPlaces = await fetchPlacesFromRapidAPI("Paris");
      type PlaceType = { id: string | number; name: string; type: string; rating?: number; description?: string; address?: string; price?: number; imageUrl?: string };
      places = mockPlaces.slice(0, 8).map((p: PlaceType) => ({
        id: String(p.id),
        cityId: null,
        cityName: "Paris",
        name: p.name,
        category: p.type,
        description: p.description,
        address: p.address,
        rating: p.rating,
        priceLevel: p.price,
        imageUrl: p.imageUrl,
        tags: null,
        reviewCount: 0,
      })) as unknown as typeof places
    }

    res.json(normalizePlaces(places));
  } catch (err) {
    console.error("Get recommendations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get place by ID
router.get("/:placeId", async (req, res) => {
  try {
    const placeId = parseInt(req.params.placeId);
    const rows = await query(
      `SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
              p.description, p.address, p.rating, p.price_level as priceLevel,
              p.image_url as imageUrl, p.tags, p.review_count as reviewCount
       FROM places p
       LEFT JOIN cities c ON c.id = p.city_id
       WHERE p.id = ?`,
      [placeId]
    );

    if (!rows.length) {
      res.status(404).json({ message: "Place not found" });
      return;
    }

    res.json(normalizePlace(rows[0]));
  } catch (err) {
    console.error("Get place error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get reviews for a place
router.get("/:placeId/reviews", async (req, res) => {
  try {
    const placeId = parseInt(req.params.placeId);
    const reviews = await query(
      `SELECT r.id, r.place_id as placeId, r.user_id as userId, u.name as userName,
              r.rating, r.comment, r.created_at as createdAt
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.place_id = ? ORDER BY r.created_at DESC`,
      [placeId]
    );
    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
