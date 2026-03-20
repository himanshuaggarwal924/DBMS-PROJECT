import { Router, type IRouter } from "express";
import { query, insert } from "../lib/mysql";
import { fetchCitiesFromRapidAPI, getCityImage, getCityInfo } from "../lib/rapidapi";

const router: IRouter = Router();

// Helper function to normalize city data types
function normalizeCity(city: any) {
  return {
    ...city,
    searchCount: city.searchCount ? parseInt(city.searchCount) : 0,
  };
}

function normalizeCities(cities: any[]) {
  return cities.map(normalizeCity);
}

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

// Get all cities (from database with fallback to RapidAPI)
router.get("/", async (req, res) => {
  try {
    // First try to get from database
    let cities = await query(
      `SELECT id, name, state, country, description, image_url as imageUrl, search_count as searchCount
       FROM cities ORDER BY search_count DESC LIMIT 20`
    );

    // If no cities in database, fetch from RapidAPI and cache
    if (cities.length === 0) {
      const rapidAPICities = await fetchCitiesFromRapidAPI();
      
      // Cache cities in database
      for (const city of rapidAPICities.slice(0, 10)) {
        try {
          await insert(
            "INSERT INTO cities (name, country, state, search_count) VALUES (?, ?, ?, ?)",
            [city.name, city.country, city.state || null, 1]
          );
        } catch (_err) {
          // Ignore duplicate key errors
        }
      }
      
      cities = await query(
        `SELECT id, name, state, country, description, image_url as imageUrl, search_count as searchCount
         FROM cities LIMIT 20`
      );
    }

    res.json(normalizeCities(cities));
  } catch (err) {
    console.error("List cities error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Search cities - supports ANY city name
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    if (!q.trim()) {
      res.status(400).json({ message: "Query parameter q is required" });
      return;
    }

    // First check database for exact/partial matches
    let cities = await query(
      `SELECT id, name, state, country, description, image_url as imageUrl, search_count as searchCount
       FROM cities
       WHERE name LIKE ? OR state LIKE ? OR country LIKE ?
       ORDER BY search_count DESC LIMIT 10`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    // If no database matches, treat search as ANY city and generate info
    if (cities.length === 0) {
      // Return city info with image (for unregistered users to see preview)
      const cityInfo = getCityInfo(q);
      cities = [{
        id: null,
        name: cityInfo.name,
        state: null,
        country: cityInfo.country,
        description: `Discover the wonders of ${cityInfo.name}. Hotels, restaurants, and attractions await.`,
        imageUrl: cityInfo.imageUrl,
        searchCount: 0,
      }] as any;
    } else {
      // Update search count for database cities
      await query(
        "UPDATE cities SET search_count = search_count + 1 WHERE name LIKE ?",
        [`%${q}%`]
      ).catch(() => {}); // Ignore errors
    }

    // Ensure all have images
    cities = normalizeCities(cities.map(c => ({
      ...c,
      imageUrl: c.imageUrl || getCityImage(c.name),
    })));

    res.json(cities);
  } catch (err) {
    console.error("City search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get popular cities (most searched)
router.get("/popular", async (req, res) => {
  try {
    let cities = await query(
      `SELECT id, name, state, country, description, image_url as imageUrl, search_count as searchCount
       FROM cities ORDER BY search_count DESC LIMIT 8`
    );

    // If no popular cities, fetch from RapidAPI
    if (cities.length === 0) {
      const rapidAPICities = await fetchCitiesFromRapidAPI();
      cities = rapidAPICities.slice(0, 8) as unknown as any[];
    }

    res.json(normalizeCities(cities));
  } catch (err) {
    console.error("Get popular cities error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get places in a city
router.get("/:cityId/places", async (req, res) => {
  try {
    const cityId = parseInt(req.params.cityId);
    const { category, minRating, maxBudget } = req.query;
    let sql = `
      SELECT p.id, p.city_id as cityId, c.name as cityName, p.name, p.category,
             p.description, p.address, p.rating, p.price_level as priceLevel,
             p.image_url as imageUrl, p.tags, p.review_count as reviewCount
      FROM places p
      JOIN cities c ON c.id = p.city_id
      WHERE p.city_id = ?`;
    const params: unknown[] = [cityId];
    if (category) {
      sql += " AND p.category = ?";
      params.push(category);
    }
    if (minRating) {
      sql += " AND p.rating >= ?";
      params.push(parseFloat(minRating as string));
    }
    if (maxBudget) {
      sql += " AND p.price_level <= ?";
      params.push(parseInt(maxBudget as string));
    }
    sql += " ORDER BY p.rating DESC";
    const places = await query(sql, params);
    res.json(normalizePlaces(places));
  } catch (err) {
    console.error("Get city places error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;