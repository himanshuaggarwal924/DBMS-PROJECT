# Travel Planner API Documentation

## Overview

The Travel Planner API provides endpoints to search for cities and places (hotels, restaurants, attractions) with smart caching. The system first checks the MySQL database for cached results. If data doesn't exist, it fetches from the RapidAPI Travel Advisor API and caches the results for faster subsequent requests.

## Base URL

```
http://localhost:5000/api
```

## Core Features

### 🔄 Smart Caching Mechanism
- **First Request**: City data is fetched from RapidAPI and stored in the database
- **Subsequent Requests**: Results are served directly from the database (no API calls)
- **Performance**: Dramatically faster response times after initial search
- **Offline Support**: Once cached, cities can be accessed without API availability

### 🔍 Advanced Filtering
- **Place Type**: Filter by hotel, restaurant, or attraction
- **Rating**: Filter by minimum rating (1.0 - 5.0)
- **Price Range**: Filter by cost level (min and max price)

---

## Endpoints

### Places Endpoints

#### 1. Get Places by City Name (Auto-Caching)
**Endpoint:** `GET /api/places/city/:cityName`

**Description:** Search for places in a city. First request fetches from API and caches; subsequent requests use cache.

**Parameters:**
```
Path Parameters:
  - cityName (string, required): Name of the city (e.g., "Goa", "Paris")

Query Parameters:
  - category (string, optional): Filter by type - "hotel", "restaurant", or "attraction"
  - minRating (number, optional): Minimum rating from 1.0 to 5.0
  - maxBudget (number, optional): Maximum cost level (1-4)
  - minBudget (number, optional): Minimum cost level (1-4)
```

**Example Request:**
```bash
curl "http://localhost:5000/api/places/city/Goa?category=hotel&minRating=4&minBudget=2&maxBudget=4"
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Taj Holiday Village",
    "cityName": "Goa",
    "type": "hotel",
    "category": "hotel",
    "rating": 4.5,
    "priceLevel": 3,
    "address": "North Goa",
    "description": "Luxury resort in Goa",
    "imageUrl": "https://...",
    "externalId": "12345",
    "externalUrl": "https://tripadvisor...",
    "source": "tripadvisor",
    "tags": "luxury, beach, resort",
    "reviewCount": 245
  }
]
```

#### 2. Get Places by City ID (Database)
**Endpoint:** `GET /api/cities/:cityId/places`

**Description:** Get cached places for a specific city ID with filtering options.

**Parameters:**
```
Path Parameters:
  - cityId (number, required): ID of the city

Query Parameters:
  - category (string, optional): Filter by type - "hotel", "restaurant", or "attraction"
  - minRating (number, optional): Minimum rating
  - maxBudget (number, optional): Maximum cost level
  - minBudget (number, optional): Minimum cost level
```

**Example Request:**
```bash
curl "http://localhost:5000/api/cities/1/places?category=restaurant&minRating=3.5&maxBudget=2"
```

**Response:**
```json
[
  {
    "id": 45,
    "name": "The Black Sheep Bistro",
    "cityName": "Goa",
    "type": "restaurant",
    "rating": 4.2,
    "priceLevel": 2,
    "address": "Panjim, Goa",
    "description": "Contemporary Indian cuisine",
    "imageUrl": "https://...",
    "reviewCount": 189
  }
]
```

#### 3. Search Live Places (No Caching)
**Endpoint:** `GET /api/places/search`

**Description:** Search for places without database caching (live API results only).

**Parameters:**
```
Query Parameters:
  - query (string, required): City or place name
  - type (string, optional): Place type - "hotel", "restaurant", or "attraction"
  - page (number, optional): Page number
  - maxPages (number, optional): Maximum pages to fetch
  - minRating (number, optional): Minimum rating
```

**Example Request:**
```bash
curl "http://localhost:5000/api/places/search?query=Goa&type=hotel&minRating=4"
```

**Response:**
```json
{
  "query": "Goa",
  "type": "hotel",
  "page": 1,
  "maxPages": null,
  "minRating": 4,
  "liveOnly": true,
  "resultCount": 15,
  "results": [...]
}
```

#### 4. Get Top-Rated Places
**Endpoint:** `GET /api/places/top`

**Description:** Get the highest-rated places across all cities with optional filtering.

**Parameters:**
```
Query Parameters:
  - limit (number, optional): Maximum results to return (default: 10, max: 50)
  - category (string, optional): Filter by type
  - minRating (number, optional): Minimum rating
  - maxBudget (number, optional): Maximum cost level
```

**Example Request:**
```bash
curl "http://localhost:5000/api/places/top?limit=20&category=attraction&minRating=4.5"
```

**Response:**
```json
[
  {
    "id": 102,
    "name": "Basilica of Bom Jesus",
    "cityName": "Goa",
    "type": "attraction",
    "rating": 4.8,
    "description": "UNESCO World Heritage Site",
    "imageUrl": "https://..."
  }
]
```

#### 5. Get Personalized Recommendations
**Endpoint:** `GET /api/places/recommendations`

**Description:** Get place recommendations based on user preferences (ratings and favorites).

**Parameters:**
```
Query Parameters:
  - userId (number, optional): User ID for personalization
  - category (string, optional): Filter by type
  - minRating (number, optional): Minimum rating
  - maxBudget (number, optional): Maximum cost level
```

**Example Request:**
```bash
curl "http://localhost:5000/api/places/recommendations?userId=5&minRating=3.5"
```

**Response:**
```json
[
  {
    "id": 78,
    "name": "Fort Aguada",
    "cityName": "Goa",
    "type": "attraction",
    "rating": 4.6,
    "description": "Historic 17th century fort"
  }
]
```

#### 6. Get Place Details
**Endpoint:** `GET /api/places/:placeId`

**Description:** Get detailed information about a specific place.

**Parameters:**
```
Path Parameters:
  - placeId (number, required): ID of the place
```

**Example Request:**
```bash
curl "http://localhost:5000/api/places/1"
```

**Response:**
```json
{
  "id": 1,
  "name": "Taj Holiday Village",
  "cityName": "Goa",
  "type": "hotel",
  "rating": 4.5,
  "priceLevel": 3,
  "address": "North Goa",
  "description": "Luxury resort",
  "imageUrl": "https://...",
  "amenities": ["Pool", "Spa", "Restaurant"],
  "cuisines": ["Indian", "Continental"],
  "website": "https://...",
  "phone": "+91-...",
  "email": "info@taj.com"
}
```

#### 7. Get Place Reviews
**Endpoint:** `GET /api/places/:placeId/reviews`

**Description:** Get reviews for a place (combines database and live reviews).

**Parameters:**
```
Path Parameters:
  - placeId (number, required): ID of the place

Query Parameters (optional):
  - page (number): Review page number
  - ratingIs (string): Filter by rating
  - since (string): Filter by date
  - travelerType (string): Filter by traveler type
  - keyword (string): Search keyword
```

**Example Request:**
```bash
curl "http://localhost:5000/api/places/1/reviews"
```

**Response:**
```json
[
  {
    "id": 1,
    "placeId": 1,
    "rating": 5,
    "comment": "Excellent experience! Great food and service.",
    "userName": "John Doe",
    "createdAt": "2024-03-15T10:30:00Z",
    "source": "tripadvisor",
    "reviewerProfile": {
      "location": "USA",
      "contributionCount": 42
    }
  }
]
```

### Cities Endpoints

#### 1. Search Cities
**Endpoint:** `GET /api/cities/search`

**Parameters:**
```
Query Parameters:
  - q (string, required): Search query
```

**Example Request:**
```bash
curl "http://localhost:5000/api/cities/search?q=Goa"
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Goa",
    "country": "India",
    "state": "Goa",
    "imageUrl": "https://...",
    "description": "Discover hotels, restaurants...",
    "searchCount": 245
  }
]
```

---

## Filtering Guide

### Category Filter
Filter places by type:
```
?category=hotel      # Hotels only
?category=restaurant # Restaurants only
?category=attraction # Attractions only
```

### Rating Filter
Filter by minimum rating (1.0 to 5.0):
```
?minRating=3.5  # Shows places rated 3.5 and above
?minRating=4    # Shows places rated 4.0 and above
```

### Price Range Filter
Filter by cost level (price levels are 1-4):
```
?minBudget=1&maxBudget=3     # Budget to mid-range
?minBudget=3&maxBudget=4     # Mid-range to luxury
?minBudget=2                  # Start from mid-range
?maxBudget=2                  # Up to mid-range
```

### Combined Filters
```bash
curl "http://localhost:5000/api/places/city/Goa?category=hotel&minRating=4&minBudget=2&maxBudget=4"
```

---

## Data Models

### Place Object
```typescript
{
  id: number;                    // Database ID
  name: string;                  // Place name
  cityName: string;              // City name
  type: "hotel" | "restaurant" | "attraction";
  category: string;              // Category (hotel/restaurant/attraction)
  rating: number;                // Rating 1.0-5.0
  priceLevel: number;            // Cost level 1-4
  address: string;               // Address
  description: string;           // Description
  imageUrl: string;              // Image URL
  externalId: string;            // External API ID
  externalUrl: string;           // Link to external review site
  source: string;                // API source (tripadvisor)
  tags: string;                  // Comma-separated tags
  reviewCount: number;           // Number of reviews
  amenities?: string[];          // Hotel amenities
  cuisines?: string[];           // Restaurant cuisines
  website?: string;              // Website URL
  phone?: string;                // Phone number
  email?: string;                // Email address
}
```

### City Object
```typescript
{
  id: number;           // Database ID
  name: string;         // City name
  country: string;      // Country
  state: string;        // State/Province
  description: string;  // Description
  imageUrl: string;     // Image URL
  searchCount: number;  // Number of times searched
}
```

### Review Object
```typescript
{
  id: number;           // Review ID
  placeId: number;      // Associated place ID
  userId: number;       // User who wrote review (0 for external)
  rating: number;       // Rating 1-5
  comment: string;      // Review text
  userName: string;     // Reviewer name
  createdAt: string;    // ISO date string
  source: string;       // Source (tripadvisor/local)
  images: string[];     // Review images
  tripType: string;     // Type of trip (business/leisure)
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "cityName is required"
}
```

### 404 Not Found
```json
{
  "message": "Place not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## Caching Behavior

### Smart Cache Logic

**First Request to a City:**
1. Check database for existing places for this city
2. If empty, fetch from RapidAPI
3. Store results in database with INSERT ... ON DUPLICATE KEY UPDATE
4. Return results to client

**Subsequent Requests:**
1. Check database for places - FOUND
2. Skip API call completely
3. Return cached results immediately
4. Response is 10-100x faster

**Cache Invalidation:**
- Manual: Clear specific city from database
- Automatic: Never (you can add TTL if needed)

### Sample Response Times
```
First request to Goa:    ~2000ms (API call + DB store)
Second request to Goa:   ~50ms (database query only)
```

---

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=travel_planner
PORT=5000

# API Configuration
TRIPADVISOR_API_KEY=your_api_key_here
TRIPADVISOR_LOCALE=en-US
TRIPADVISOR_CURRENCY=INR
TRIPADVISOR_MAX_PAGES=2
```

---

## Example Usage

### TypeScript React Hook
```typescript
import { useGetCityPlacesByName } from './api-client-react';

function SearchPlaces() {
  const [filters, setFilters] = useState({
    category: 'hotel',
    minRating: 4,
    minBudget: 2,
    maxBudget: 4
  });

  const { data: places, isLoading } = useGetCityPlacesByName('Goa', {
    category: filters.category,
    minRating: filters.minRating,
    minBudget: filters.minBudget,
    maxBudget: filters.maxBudget
  });

  return (
    <div>
      {isLoading ? <p>Loading...</p> : (
        places?.map(place => (
          <div key={place.id}>
            <h3>{place.name}</h3>
            <p>Rating: {place.rating}</p>
          </div>
        ))
      )}
    </div>
  );
}
```

### Curl Examples
```bash
# Search for hotels in Goa
curl "http://localhost:5000/api/places/city/Goa?category=hotel"

# Get restaurants with 4+ rating
curl "http://localhost:5000/api/places/city/Paris?category=restaurant&minRating=4"

# Get top attractions within budget
curl "http://localhost:5000/api/places/top?category=attraction&maxBudget=2"

# Search with price range
curl "http://localhost:5000/api/places/city/Tokyo?minBudget=1&maxBudget=3"
```

---

## Performance Tips

1. **Use City ID** when possible instead of city name (avoids string lookups)
2. **Cache results** on the frontend using React Query (already implemented)
3. **Combine filters** to reduce result set size
4. **Set appropriate budget limits** to focus results
5. **Reuse city data** - first search is slower, subsequent searches are instant

---

## Database Schema

The system uses the following database tables:

- **cities**: City information and search count
- **places**: Place details with ratings and pricing
- **reviews**: User reviews for places
- **favorites**: User favorite places
- **trips**: User trip itineraries
- **trip_places**: Many-to-many relationship between trips and places
- **users**: User accounts and preferences

All tables include proper indices for fast filtering and searching.

---

## Support & Troubleshooting

### No results returned?
1. Verify city name spelling
2. Check API key in .env file
3. Verify database connection
4. Check browser console for errors

### Slow responses?
1. First request is expected to be slower (API call)
2. Subsequent requests should be fast
3. Verify database indices are created
4. Check database connection pool settings

### API key errors?
1. Regenerate API key from RapidAPI
2. Update TRIPADVISOR_API_KEY in .env
3. Restart server: `npm run dev`
