# Smart Travel Planning and Recommendation System - Setup Guide

## Project Overview

This is a full-stack web application for travel planning that helps users explore and organize travel information for different cities. The application stores and manages travel data using a MySQL database.

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL
- **UI Libraries**: TailwindCSS, Lucide Icons, Framer Motion, Recharts

---

## Prerequisites

Before starting, ensure you have installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MySQL Server** (v5.7 or higher)
- **Git** (optional)

---

## Installation & Setup

### 1. Clone/Download the Project
```bash
cd travel-planner
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

---

## Database Setup

### 1. Create MySQL Database

Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE travel_planner;
USE travel_planner;
```

### 2. Import Database Schema

Run the SQL schema from the server folder:

```bash
mysql -u root -p travel_planner < server/schema.sql
```

Or manually execute the queries in `server/schema.sql` in your MySQL client.

### 3. Verify Tables Created

Tables that should be created:
- `users` - User registration and login data
- `places` - Hotels, restaurants, attractions
- `reviews` - User reviews and ratings
- `favorites` - Bookmarked places
- `trips` - Trip itineraries
- `trip_places` - Places in each trip

---

## Environment Configuration

### Backend Configuration

Edit `server/.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=travel_planner

# JWT Secret (use a strong secret in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# API Keys (optional for now)
RAPIDAPI_KEY=your_rapidapi_key

# Server Port
PORT=5000
```

### Frontend Configuration

Edit `.env.local` (in root):

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Project

### Option 1: Run Frontend & Backend Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

### Option 2: Build for Production

**Build Frontend:**
```bash
npm run build
```

**Build Backend:**
```bash
cd server
npm run build
npm start
```

---

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

### Cities & Places
- `GET /api/cities/popular` - Get popular cities
- `GET /api/cities/:id/places` - Get places in a city
- `GET /api/cities/search?q=query` - Search cities
- `GET /api/places/top` - Get top-rated places
- `GET /api/places/:id` - Get place details

### Reviews
- `POST /api/reviews` - Add a review
- `GET /api/reviews/:placeId` - Get place reviews

### Favorites
- `POST /api/favorites` - Add to favorites
- `GET /api/favorites/:userId` - Get user favorites

### Trips
- `POST /api/trips` - Create trip
- `GET /api/trips/:userId` - Get user trips
- `POST /api/trips/:tripId/places` - Add place to trip

---

## Project Structure

```
travel-planner/
├── src/                          # Frontend source
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── lib/                      # Utilities & API hooks
│   ├── api-client-react.ts      # React Query hooks & API client
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── server/                       # Backend source
│   ├── routes/                   # API route handlers
│   ├── lib/                      # Database utilities
│   ├── db.ts                     # Database connection
│   ├── server.ts                 # Express server
│   ├── schema.sql                # Database schema
│   └── tsconfig.json             # TypeScript config
├── dist/                         # Built frontend (after npm run build)
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.local                    # Frontend env variables
```

---

## Key Features Implemented

### ✅ Frontend Features
1. **User Authentication** - Register & Login
2. **City Search** - Find cities by name
3. **Place Discovery** - Browse hotels, restaurants, attractions
4. **Ratings & Reviews** - View and add reviews
5. **Favorites/Wishlist** - Save places for later
6. **Trip Planning** - Create and manage itineraries
7. **Analytics** - View popular destinations and trends
8. **Responsive Design** - Works on desktop, tablet, and mobile

### ✅ Backend Features
1. **User Management** - Secure registration and JWT authentication
2. **Place Management** - CRUD operations for places
3. **Review System** - User reviews and ratings
4. **Favorites Tracking** - Save user preferences
5. **Trip Management** - Create and manage trip itineraries
6. **API Caching** - Store API responses in database

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Ensure MySQL is running
- Check DB credentials in `server/.env`
- Verify database exists: `SHOW DATABASES;`

**2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
- Change PORT in `server/.env`
- Or kill process using port 5000

**3. Frontend Can't Connect to Backend**
- Verify `VITE_API_URL` in `.env.local` is correct
- Check backend is running on port 5000
- Check browser console for CORS errors

**4. Module Not Found Errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

---

## Development Features

### TypeScript Support
Both frontend and backend use TypeScript for type safety.

### Hot Module Replacement (HMR)
Frontend supports hot reload with Vite during development.

### Database Migrations
Use `server/schema.sql` to recreate tables anytime.

### API Testing
Use **Postman** or **Thunder Client** to test backend endpoints.

---

## Production Deployment

### Build Frontend
```bash
npm run build
```
This creates optimized files in `dist/` folder.

### Deploy Frontend
- Upload contents of `dist/` to web hosting (Netlify, Vercel, GitHub Pages, etc.)
- Set `VITE_API_URL` environment variable to production backend URL

### Deploy Backend
- Host Node.js app on (Render, Heroku, Railway, AWS, DigitalOcean, etc.)
- Set environment variables on hosting platform
- Ensure MySQL is accessible from backend server

---

## Default Login Credentials

After running the database schema, no default users exist. You must:
1. Register a new account through the app
2. Or insert manually via SQL:

```sql
INSERT INTO users (username, email, password) 
VALUES ('testuser', 'test@example.com', 'hashed_password');
```

---

## Support & Documentation

- **Frontend API**: React Query documentation: https://tanstack.com/query/latest
- **Backend**: Express.js docs: https://expressjs.com/
- **Database**: MySQL docs: https://dev.mysql.com/doc/
- **UI Components**: Lucide React: https://lucide.dev/

---

## License

This project is created for educational purposes.

---

## Notes for Future Development

1. **Authentication**: Replace JWT with OAuth2 for better security
2. **API Integration**: Integrate RapidAPI for real travel data
3. **Caching**: Implement Redis for better performance
4. **Testing**: Add unit and integration tests
5. **CI/CD**: Set up GitHub Actions for automated testing and deployment
6. **File Upload**: Add image upload for places and user profiles
7. **Real-time Features**: Implement WebSocket for live notifications
