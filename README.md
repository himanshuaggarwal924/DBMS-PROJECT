# Smart Travel Planning and Recommendation System

## Project Overview

The **Smart Travel Planning and Recommendation System** is a full‑stack web application that helps users explore and plan trips by discovering **hotels, restaurants, and tourist attractions** in different cities.

Users can search for a city and view travel‑related information such as ratings, reviews, and recommendations. The system also allows users to save favorite places, create trip itineraries, track expenses, and get smart recommendations based on what other users saved together.

This project demonstrates advanced **Database Management System (DBMS) concepts** including:
- ER modeling and relational schema design (3NF)
- Complex SQL queries (joins, subqueries, aggregations, self‑joins)
- Database caching (cache‑aside pattern with MySQL advisory locks)
- Stored procedures and Common Table Expressions (CTEs)
- Spatial queries (Haversine formula for distance sorting)
- Concurrency control (row‑level locking, advisory locks)
- Integrity constraints (primary keys, foreign keys, check constraints, unique constraints)

---

## Features

### User Management
- User registration and login (JWT authentication, bcrypt password hashing)
- Role‑based access (`user` / `admin`)
- Forgot password / reset password (secure token)

### City Search with Database Caching
- **First search** for a city fetches data from an external API (RapidAPI Travel Advisor) and stores it in MySQL.
- **Subsequent searches** read directly from the database – up to 10x faster (cache‑aside pattern).
- MySQL advisory locks prevent duplicate API calls when two users search the same new city simultaneously.

### Interactive Maps & Location Services
- **Google Maps integration** – show place locations on a draggable map with markers.
- **Nearby places** – search for places within a user‑defined radius (e.g., 5 km) using the Haversine formula inside SQL.
- **Distance sorting** – sort search results by distance from the user’s current location or a clicked map point.
- **OpenStreetMap (OSM) Nominatim fallback** – free geocoding (address → coordinates) without a Google API key.

### Advanced Filtering & Sorting
- Filter by place type (hotel / restaurant / attraction)
- Filter by cost range and minimum rating
- Sort by rating (highest first)
- Sort by distance from a chosen location (Haversine)

### Favorites / Wishlist
- Save places for future visits
- View and manage saved places

### Trip Planner & Itinerary Builder
- Create trips with destination city, dates, and planned budget
- Build day‑wise itineraries: add places to a trip, assign `day_number` and `visit_order`
- One‑click **optimise order by distance** – reorders places within a day using the Haversine formula (pure SQL)

### Budget Dashboard & Expense Tracking
- Compare planned budget vs actual expenses (SQL `SUM` aggregation)
- Add expenses with amount, category (food, travel, shopping, tickets, other), date, and optional place
- Visual progress bar for remaining budget

### Smart Recommendations (Database‑Driven)
- **“Frequently Saved Together”** – uses a self‑join on the `Favorites` table to recommend places that other users saved together with the current place (market basket analysis in SQL).
- **Stored procedure – “Best Value”** – `GetBestValuePlaces` computes `rating / avg_cost` and returns the top‑10 places within a user’s budget.

### Popularity & Trend Analytics (Admin Dashboard)
- Most searched cities (from `User_Searches` table)
- Most popular attractions / top‑rated restaurants
- User activity in the last 7 days – using a **Common Table Expression (CTE)**
- City‑wise statistics (total places, average cost, most common category)

### Database Caching & Performance
- Cache‑aside pattern (MySQL as cache layer)
- Indexes on frequently queried columns (`city_id`, `category_id`, `rating`, `searched_at`)
- Row‑level locking for popularity counters

### Budget-Based Filtering
- Filter places based on rating, category, and cost range

---

## Tech Stack

### Frontend
- React.js (functional components, hooks)
- React Router (navigation)
- Axios (API calls, JWT interceptor)
- Google Maps JavaScript API (interactive maps)
- Tailwind CSS (responsive design)

### Backend
- Node.js + Express.js
- JWT (jsonwebtoken) for authentication
- Bcrypt for password hashing
- MySQL2 (promise) for async database access

### Database
- MySQL 8.0 (InnoDB, 3NF schema, 10+ tables)

### External APIs
- **Google Maps JavaScript API** (maps and markers)
- **OpenStreetMap Nominatim** (free geocoding fallback)

---

## System Architecture

The frontend sends REST requests to the backend API.  
The backend processes the request, applies caching logic, executes SQL queries (joins, aggregations, stored procedures), and returns JSON data.  
Maps and geocoding are handled either by Google Maps (frontend) or OSM (backend fallback).

---

## Database Concepts Used

This project demonstrates a wide range of DBMS concepts:

- **Entity Relationship (ER) Modeling** – 10+ tables with proper relationships
- **Relational Schema Design** – 3NF normalisation (e.g., city names stored once in `Cities`)
- **Primary Keys and Foreign Keys** – referential integrity enforced
- **One‑to‑Many and Many‑to‑Many Relationships** – resolved via junction tables (`Trip_Places`, `Favorites`)
- **SQL Joins** – INNER, LEFT, and SELF joins (for recommendations)
- **Aggregate Functions** – `AVG`, `COUNT`, `SUM`, `GROUP BY`
- **Subqueries and CTEs** – Common Table Expression for admin reports
- **Stored Procedures** – `GetBestValuePlaces` for best‑value ranking
- **Spatial Queries** – Haversine formula inside SQL for distance sorting
- **Caching (Cache‑aside)** – MySQL as cache layer with advisory locks
- **Concurrency Control** – row‑level locking (`SELECT FOR UPDATE`) and `GET_LOCK()` advisory locks
- **Data Integrity Constraints** – `CHECK` (rating 0–5), `UNIQUE`, `NOT NULL`

---


---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/project-name.git
cd project-name
cd frontend
npm install
mysql -u root -p travel_planner < backend/sql/schema.sql
mysql -u root -p travel_planner < backend/sql/stored_procedures.sql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=travel_planner
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

