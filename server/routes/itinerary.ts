import { Router, type IRouter } from "express";
import { generatePlacesForCity } from "../lib/rapidapi";

const router: IRouter = Router();

interface ItineraryRequest {
  city: string;
  days: number;
  budget: number;
  accommodationType: "hotel" | "hostel" | "resort" | "budget";
  interests: string[]; // ["attractions", "restaurants", "nightlife", "shopping", etc]
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: Array<{
    time: string;
    place: string;
    type: string;
    estimatedCost: number;
    description: string;
  }>;
  dayBudget: number;
  meals: string[];
}

/**
 * Generate custom itinerary based on user preferences
 */
router.post("/generate", async (req, res) => {
  try {
    const { city, days, budget, accommodationType, interests }: ItineraryRequest = req.body;

    if (!city || !days || !budget) {
      res.status(400).json({ message: "City, days, and budget are required" });
      return;
    }

    // Get all places for the city
    const allPlaces = generatePlacesForCity(city);
    
    // Separate places by type - use ALL places for comprehensive itinerary
    const attractions = allPlaces.filter(p => p.type === "attraction");
    const restaurants = allPlaces.filter(p => p.type === "restaurant");
    const hotels = allPlaces.filter(p => p.type === "hotel");

    // Calculate budget allocation
    const dailyBudget = budget / days;
    const accommodationCost = getAccommodationCost(accommodationType, dailyBudget);
    const foodBudget = dailyBudget * 0.25; // 25% for food
    const activitiesBudget = dailyBudget * 0.75 - accommodationCost; // Rest for activities

    // Generate day-by-day itinerary
    const itinerary: ItineraryDay[] = [];

    for (let day = 1; day <= days; day++) {
      const dayActivities = generateDayActivities(
        day,
        city,
        attractions,
        restaurants,
        activitiesBudget,
        foodBudget
      );

      itinerary.push({
        day,
        title: `Day ${day} - Explore ${city}`,
        activities: dayActivities,
        dayBudget: dailyBudget,
        meals: [
          `Breakfast at local cafe (₹${Math.floor(foodBudget * 0.25)})`,
          `Lunch at ${restaurants[day % restaurants.length]?.name || "local restaurant"} (₹${Math.floor(foodBudget * 0.4)})`,
          `Dinner at ${restaurants[(day + 1) % restaurants.length]?.name || "restaurant"} (₹${Math.floor(foodBudget * 0.35)})`,
        ],
      });
    }

    res.json({
      city,
      totalDays: days,
      totalBudget: budget,
      dailyBudget: Math.floor(dailyBudget),
      accommodation: {
        type: accommodationType,
        costPerNight: accommodationCost,
        totalCost: accommodationCost * days,
        hotel: hotels[0] || null,
      },
      itinerary,
      estimatedCosts: {
        accommodation: accommodationCost * days,
        food: foodBudget * days,
        activities: activitiesBudget * days,
        contingency: budget * 0.1,
      },
    });
  } catch (err) {
    console.error("Itinerary generation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Helper: Get accommodation cost based on type
 */
function getAccommodationCost(type: string, dailyBudget: number): number {
  const costs: Record<string, number> = {
    budget: dailyBudget * 0.15,
    hostel: dailyBudget * 0.2,
    hotel: dailyBudget * 0.3,
    resort: dailyBudget * 0.4,
  };
  return costs[type] || costs.hotel;
}

/**
 * Helper: Generate activities for a day with better variety
 */
function generateDayActivities(
  day: number,
  city: string,
  attractions: any[],
  restaurants: any[],
  activitiesBudget: number,
  foodBudget: number
): ItineraryDay["activities"] {
  const activities: ItineraryDay["activities"] = [];
  const cityTitle = city.charAt(0).toUpperCase() + city.slice(1);
  
  if (attractions.length === 0 && restaurants.length === 0) {
    // Fallback if no places
    activities.push(
      {
        time: "08:00 - 11:00",
        place: `${cityTitle} Museum`,
        type: "attraction",
        estimatedCost: 15,
        description: "Explore local history and culture",
      },
      {
        time: "12:00 - 14:00",
        place: `Local Restaurant`,
        type: "restaurant",
        estimatedCost: Math.floor(foodBudget * 0.4),
        description: "Lunch with local cuisine",
      },
      {
        time: "14:00 - 17:00",
        place: `${cityTitle} Park`,
        type: "attraction",
        estimatedCost: 0,
        description: "Relax at scenic locations",
      },
      {
        time: "18:00 - 21:00",
        place: `Fine Dining Restaurant`,
        type: "restaurant",
        estimatedCost: Math.floor(foodBudget * 0.5),
        description: "Evening dinner experience",
      }
    );
    return activities;
  }

  // Use actual place data for better variety
  const mornningIdx = (day - 1) % attractions.length;
  const afternoonIdx = (day) % attractions.length;
  const breakfastIdx = (day - 1) % restaurants.length;
  const lunchIdx = (day) % restaurants.length;
  const dinnerIdx = (day + 1) % restaurants.length;

  // Morning activity (8 AM - 11 AM)
  const morningPlace = attractions[mornningIdx];
  activities.push({
    time: "08:00 - 11:00",
    place: morningPlace?.name || `${cityTitle} Museum`,
    type: "attraction",
    estimatedCost: Math.floor((morningPlace?.price || 15) * 0.6),
    description: morningPlace?.description || "Explore local attractions and history",
  });

  // Lunch (12 PM - 2 PM)
  const lunchPlace = restaurants[lunchIdx];
  activities.push({
    time: "12:00 - 14:00",
    place: lunchPlace?.name || "Local Restaurant",
    type: "restaurant",
    estimatedCost: Math.floor(foodBudget * 0.4),
    description: lunchPlace?.description || "Enjoy authentic local cuisine",
  });

  // Afternoon activity (2 PM - 5 PM)
  const afternoonPlace = attractions[afternoonIdx];
  activities.push({
    time: "14:00 - 17:00",
    place: afternoonPlace?.name || `${cityTitle} Park`,
    type: "attraction",
    estimatedCost: Math.floor((afternoonPlace?.price || 10) * 0.6),
    description: afternoonPlace?.description || "Explore parks and markets",
  });

  // Dinner (6 PM - 9 PM)
  const dinnerPlace = restaurants[dinnerIdx];
  activities.push({
    time: "18:00 - 21:00",
    place: dinnerPlace?.name || "Fine Dining Restaurant",
    type: "restaurant",
    estimatedCost: Math.floor(foodBudget * 0.5),
    description: dinnerPlace?.description || "Experience local fine dining",
  });

  // Evening/Shopping (9 PM+)
  activities.push({
    time: "21:00+",
    place: `${cityTitle} Night Market & Shopping`,
    type: "attraction",
    estimatedCost: Math.floor(activitiesBudget * 0.15),
    description: "Shopping, street food, and evening entertainment",
  });

  return activities;
}

export default router;
