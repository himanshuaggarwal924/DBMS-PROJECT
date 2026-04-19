# Smart Travel Planning and Recommendation System

## Project Overview
The **Smart Travel Planning and Recommendation System** is a full-stack web application that helps users explore and plan trips by discovering **hotels, restaurants, and tourist attractions** in different cities.

Users can search for a city and view travel-related information such as ratings, reviews, and recommendations. The system also allows users to save favorite places and create trip itineraries.

This project demonstrates the practical implementation of **Database Management System (DBMS) concepts** such as ER modeling, relational schema design, SQL queries, joins, constraints, and data analytics.

---

## Features

### User Management
- User registration and login
- User profile management
- Store user preferences

### City-Based Search
- Search for a city
- View hotels, restaurants, and tourist attractions

### Ratings and Reviews
- Users can rate places
- Write reviews
- View average ratings

### Favorites / Wishlist
- Save places for future visits

### Trip Planner
- Create travel plans
- Add places to itinerary

### Recommendation System
- Suggest places based on ratings and user preferences

### Popularity & Trend Analytics
- Most searched cities
- Most popular attractions
- Top-rated restaurants

### Budget-Based Filtering
- Filter places based on ratings, category, and budget

---

## Tech Stack

### Frontend
- React.js
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MySQL

### APIs
- TripAdvisor Scraper API by Omkar Cloud

---

## System Architecture

User → React Frontend → Node.js/Express Backend → MySQL Database → External APIs

The frontend sends requests to the backend API.  
The backend processes the request, interacts with the MySQL database, and returns the required data.

---

## Database Concepts Used

This project demonstrates several important DBMS concepts:

- Entity Relationship (ER) Modeling
- Relational Schema Design
- Primary Keys and Foreign Keys
- One-to-Many Relationships
- Many-to-Many Relationships
- SQL Joins
- Aggregate Functions (`AVG`, `COUNT`)
- Group By and Filtering Queries
- Data Integrity Constraints

---

## Project Structure

```
project-root
│
├── frontend
│   ├── src
│   ├── components
│   └── pages
│
├── backend
│   ├── routes
│   ├── controllers
│   ├── models
│   └── server.js
│
├── database
│   └── schema.sql
│
└── README.md
```

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/project-name.git
```

### 2. Install Dependencies

Frontend

```bash
cd frontend
npm install
```

Backend

```bash
cd backend
npm install
```

### 3. Setup MySQL Database

Create a MySQL database:

```sql
CREATE DATABASE travel_planner;
```

Update the database configuration in the backend.

### 4. Configure Live API Access

Create `server/.env` from `server/.env.example` and set:

```bash
TRIPADVISOR_API_KEY=your_omkar_tripadvisor_api_key_here
TRIPADVISOR_LOCALE=en-US
TRIPADVISOR_CURRENCY=INR
TRIPADVISOR_MAX_PAGES=2
```

This project now uses live TripAdvisor scraper API data for cities, hotels, restaurants, attractions, details, and reviews.
If the API key is missing or invalid, live listing endpoints will not return data.

### 5. Run the Application

Start backend server:

```bash
npm start
```

Start frontend:

```bash
npm start
```

---

