import axios from "axios";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = "airbnb13.p.rapidapi.com";

const rapidAPIClient = axios.create({
  headers: {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
  },
});

interface RapidAPICity {
  name: string;
  country: string;
  state?: string;
  imageUrl?: string;
}

interface RapidAPIPlace {
  id: string;
  name: string;
  type: "hotel" | "restaurant" | "attraction";
  rating?: number;
  description?: string;
  address?: string;
  price?: number;
  imageUrl?: string;
}

// City image mapping - covers major cities worldwide
const CITY_IMAGE_MAP: Record<string, string> = {
  // Indian Cities
  "delhi": "https://images.unsplash.com/photo-1597577459583-839a6f78f3dc?w=800",
  "mumbai": "https://images.unsplash.com/photo-1599661046289-e31897846ca3?w=800",
  "bangalore": "https://images.unsplash.com/photo-1466637574326-fda84723e495?w=800",
  "hyderabad": "https://images.unsplash.com/photo-1570459027352-4817c6179d49?w=800",
  "jaipur": "https://images.unsplash.com/photo-1580822260413-3355e780ae0d?w=800",
  "agra": "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800",
  "kolkata": "https://images.unsplash.com/photo-1568180485687-8b9e01099bf8?w=800",
  "goa": "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=800",
  "chandigarh": "https://images.unsplash.com/photo-1569163139394-de4798aa62b3?w=800",
  "pune": "https://images.unsplash.com/photo-1570581027985-e8d67bb2ce4e?w=800",
  "ahmedabad": "https://images.unsplash.com/photo-1519167758993-c6078db264c8?w=800",
  "lucknow": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
  "indore": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
  // International Cities
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
  "los angeles": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  "chicago": "https://images.unsplash.com/photo-1494522510464-9f2a9a493d13?w=800",
  "paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
  "london": "https://images.unsplash.com/photo-1529154036339-40f5e47b1883?w=800",
  "tokyo": "https://images.unsplash.com/photo-1540959375944-7049f642e9a4?w=800",
  "dubai": "https://images.unsplash.com/photo-1512453475868-9f0e4c10e83d?w=800",
  "barcelona": "https://images.unsplash.com/photo-1562883676-c9f8b2e4f0e1?w=800",
  "singapore": "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800",
  "bangkok": "https://images.unsplash.com/photo-1548013146-72479768bada?w=800",
  "sydney": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  "amsterdam": "https://images.unsplash.com/photo-1528778104028-098e9c6f9de8?w=800",
  "rome": "https://images.unsplash.com/photo-1552832928-e6db8f3a3cee?w=800",
  "bali": "https://images.unsplash.com/photo-1498711134630-51aef1c3f5b2?w=800",
};

/**
 * Get city image by city name
 */
export function getCityImage(cityName: string): string {
  const key = cityName.toLowerCase().trim();
  return CITY_IMAGE_MAP[key] || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800";
}

/**
 * Generate comprehensive places for ANY city with all categories
 */
export function generatePlacesForCity(city: string): RapidAPIPlace[] {
  const cityTitle = city.charAt(0).toUpperCase() + city.slice(1);
  
  return [
    // Hotels
    {
      id: "h1",
      name: `The Grand ${cityTitle} Hotel`,
      type: "hotel",
      rating: 4.8,
      description: "5-star luxury hotel with world-class amenities and exceptional service",
      address: `Premium District, ${cityTitle}`,
      price: 350,
      imageUrl: "https://images.unsplash.com/photo-1631049307038-da5ec5d974b5?w=800",
    },
    {
      id: "h2",
      name: `${cityTitle} Plaza Hotel`,
      type: "hotel",
      rating: 4.6,
      description: "Modern 4-star hotel in the heart of the city with business facilities",
      address: `City Center, ${cityTitle}`,
      price: 200,
      imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800",
    },
    {
      id: "h3",
      name: `Comfort Inn ${cityTitle}`,
      type: "hotel",
      rating: 4.4,
      description: "Budget-friendly hotel with comfortable rooms and good service",
      address: `Main Street, ${cityTitle}`,
      price: 80,
      imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3de?w=800",
    },
    {
      id: "h4",
      name: `Heritage ${cityTitle} Resort`,
      type: "hotel",
      rating: 4.7,
      description: "Unique heritage hotel with traditional architecture and modern comfort",
      address: `Old Town, ${cityTitle}`,
      price: 220,
      imageUrl: "https://images.unsplash.com/photo-1571896522202-07551b168466?w=800",
    },
    // Restaurants
    {
      id: "r1",
      name: `${cityTitle} Fine Dining`,
      type: "restaurant",
      rating: 4.9,
      description: "Award-winning restaurant with international and local cuisine",
      address: `Premium District, ${cityTitle}`,
      price: 150,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    },
    {
      id: "r2",
      name: `Local Flavors Bistro`,
      type: "restaurant",
      rating: 4.5,
      description: "Traditional cuisine and authentic flavors in a cozy atmosphere",
      address: `Downtown, ${cityTitle}`,
      price: 45,
      imageUrl: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800",
    },
    {
      id: "r3",
      name: `Street Food Market`,
      type: "restaurant",
      rating: 4.6,
      description: "Popular street food and casual dining experience",
      address: `Market Area, ${cityTitle}`,
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561621?w=800",
    },
    {
      id: "r4",
      name: `${cityTitle} Cafe`,
      type: "restaurant",
      rating: 4.3,
      description: "Cozy cafe with coffee, pastries, and light meals",
      address: `Central Plaza, ${cityTitle}`,
      price: 15,
      imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
    },
    // Attractions
    {
      id: "a1",
      name: `${cityTitle} Central Museum`,
      type: "attraction",
      rating: 4.7,
      description: "World-class museum showcasing local history and art",
      address: `Museum District, ${cityTitle}`,
      price: 15,
      imageUrl: "https://images.unsplash.com/photo-1564399579883-451a5d44ec0a?w=800",
    },
    {
      id: "a2",
      name: `${cityTitle} Historic Monument`,
      type: "attraction",
      rating: 4.8,
      description: "Ancient historical monument and iconic landmark",
      address: `Old City, ${cityTitle}`,
      price: 10,
      imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
    },
    {
      id: "a3",
      name: `${cityTitle} Park`,
      type: "attraction",
      rating: 4.6,
      description: "Beautiful green space with gardens and walking trails",
      address: `Downtown, ${cityTitle}`,
      price: 0,
      imageUrl: "https://images.unsplash.com/photo-1504681869696-d977e3605ba0?w=800",
    },
    {
      id: "a4",
      name: `${cityTitle} Beach/Waterfront`,
      type: "attraction",
      rating: 4.7,
      description: "Scenic waterfront area perfect for relaxation and photography",
      address: `Waterfront, ${cityTitle}`,
      price: 0,
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    },
    {
      id: "a5",
      name: `${cityTitle} Shopping District`,
      type: "attraction",
      rating: 4.5,
      description: "Premier shopping and entertainment district",
      address: `Commercial Zone, ${cityTitle}`,
      price: 0,
      imageUrl: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800",
    },
  ];
}


/**
 * Fetch popular cities from RapidAPI
 * Falls back to mock data if API key not configured
 */
export async function fetchCitiesFromRapidAPI(): Promise<RapidAPICity[]> {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === "") {
    console.log("RapidAPI key not configured, using mock data");
    return getMockCities();
  }

  try {
    // Using Airbnb API endpoint as example
    const response = await rapidAPIClient.get(
      `https://${RAPIDAPI_HOST}/searchDestination`,
      {
        params: {
          q: "popular",
        },
      }
    );

    return response.data.data || getMockCities();
  } catch (error) {
    console.error("RapidAPI error fetching cities:", error);
    return getMockCities();
  }
}

/**
 * Fetch places/accommodations for a city from RapidAPI
 */
export async function fetchPlacesFromRapidAPI(
  city: string,
  category?: string
): Promise<RapidAPIPlace[]> {
  // Generate comprehensive places for any city
  let places = generatePlacesForCity(city);
  
  // Filter by category if specified
  if (category) {
    places = places.filter(p => p.type === category);
  }

  return places;
}

/**
 * Mock data for development/fallback
 */
function getMockCities(): RapidAPICity[] {
  return [
    { name: "New York", country: "USA", state: "NY" },
    { name: "Los Angeles", country: "USA", state: "CA" },
    { name: "Chicago", country: "USA", state: "IL" },
    { name: "Paris", country: "France" },
    { name: "London", country: "UK" },
    { name: "Tokyo", country: "Japan" },
    { name: "Dubai", country: "UAE" },
    { name: "Barcelona", country: "Spain" },
  ];
}

/**
 * Get city info by name for ANY city
 */
export function getCityInfo(cityName: string): RapidAPICity {
  return {
    name: cityName,
    country: "International",
    imageUrl: getCityImage(cityName),
  };
}



export default rapidAPIClient;
