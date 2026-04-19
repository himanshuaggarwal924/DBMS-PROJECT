type ImageCategory = "city" | "place" | "attraction";

// Array of diverse, beautiful city images from Unsplash
export const POPULAR_CITY_IMAGES = [
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80", // New York
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80", // Paris
  "https://images.unsplash.com/photo-1540959375944-7049f642e9a4?w=800&q=80", // Tokyo
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", // Beach/Goa
  "https://images.unsplash.com/photo-1512453475868-9f0e4c10e83d?w=800&q=80", // Dubai
  "https://images.unsplash.com/photo-1529154036339-40f5e47b1883?w=800&q=80", // London
  "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80", // Bangkok
  "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80", // Singapore
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80", // Bali
  "https://images.unsplash.com/photo-1535189549336-03fe7665e8e0?w=800&q=80", // Venice
];

export const PLACE_IMAGES = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", // Luxury hotel
  "https://images.unsplash.com/photo-1552832928-e6db8f3a3cee?w=800&q=80", // Historic building
  "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80", // Restaurant
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", // Luxury resort
  "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=800&q=80", // Restaurant dining
  "https://images.unsplash.com/photo-1571861533944-c8cb1d0fdd9b?w=800&q=80", // Coffee shop
  "https://images.unsplash.com/photo-1414235077418-8ea040443a69?w=800&q=80", // Bar/lounge
  "https://images.unsplash.com/photo-1562883676-c9f8b2e4f0e1?w=800&q=80", // Attraction
  "https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=800&q=80", // Museum
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80", // Night market
];

export const ATTRACTION_IMAGES = [
  "https://images.unsplash.com/photo-1570144611937-0efc0c5f0d0d?w=800&q=80", // Mountain
  "https://images.unsplash.com/photo-1472791108553-c9405341e398?w=800&q=80", // Nature
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", // Sydney Opera House
  "https://images.unsplash.com/photo-1552832928-e6db8f3a3cee?w=800&q=80", // Colosseum
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80", // Hiking
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", // Landmark
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80", // Festival
  "https://images.unsplash.com/photo-1533727937480-da3ca97ff0bb?w=800&q=80", // Beach
];

// Get a random image
export const getRandomImage = (category: ImageCategory = "city"): string => {
  const images = {
    city: POPULAR_CITY_IMAGES,
    place: PLACE_IMAGES,
    attraction: ATTRACTION_IMAGES,
  };
  const arr = images[category];
  return arr[Math.floor(Math.random() * arr.length)];
};

// Get seeded random image based on ID (consistent for same ID)
export const getSeededImage = (id: number, category: ImageCategory = "city"): string => {
  const images = {
    city: POPULAR_CITY_IMAGES,
    place: PLACE_IMAGES,
    attraction: ATTRACTION_IMAGES,
  };
  const arr = images[category];
  return arr[id % arr.length];
};

function toSeedValue(seed: number | string | null | undefined) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return Math.abs(Math.floor(seed));
  }
  if (typeof seed === "string" && seed.trim()) {
    return Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  }
  return 0;
}

export function normalizeImageUrl(url?: string | null) {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  return undefined;
}

export function getSeededImageFromKey(seed: number | string | null | undefined, category: ImageCategory = "city") {
  return getSeededImage(toSeedValue(seed), category);
}

export function getCityImageSources(city: {
  id?: number | null;
  name?: string | null;
  imageUrl?: string | null;
}) {
  return [
    normalizeImageUrl(city.imageUrl),
    getSeededImageFromKey(city.id ?? city.name, "city"),
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
}

export function getPlaceImageSources(place: {
  id?: number | string | null;
  name?: string | null;
  type?: string | null;
  imageUrl?: string | null;
  photos?: string[] | null;
}) {
  const category: ImageCategory = place.type === "attraction" ? "attraction" : "place";
  const photoSources = (place.photos || []).map((photo) => normalizeImageUrl(photo));

  return [
    normalizeImageUrl(place.imageUrl),
    ...photoSources,
    getSeededImageFromKey(place.id ?? place.name, category),
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
}

// Track user view/search for personalization
export const trackUserActivity = (_type: "search" | "view" | "favorite", targetId: number, targetType: "city" | "place") => {
  try {
    const key = `user_activity_${targetType}`;
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    existing[targetId] = (existing[targetId] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (err) {
    console.error("Error tracking activity:", err);
  }
};

// Get personalized recommendations based on user activity
export const getPersonalizationScore = (targetId: number, targetType: "city" | "place"): number => {
  try {
    const key = `user_activity_${targetType}`;
    const activities = JSON.parse(localStorage.getItem(key) || "{}");
    return activities[targetId] || 0;
  } catch {
    return 0;
  }
};
