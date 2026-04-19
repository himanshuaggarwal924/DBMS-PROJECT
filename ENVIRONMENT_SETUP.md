# Environment Setup Guide

## Overview

This guide covers setting up all environment variables and configuration needed to run the Travel Planner application with the RapidAPI integration and MySQL database.

---

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MySQL** (v5.7 or higher)
3. **RapidAPI Account** with Travel Advisor API access
4. **npm** or **yarn** package manager

---

## Step-by-Step Setup

### 1. Get RapidAPI Key

1. Go to [RapidAPI](https://rapidapi.com) and sign up
2. Search for "Travel Advisor" or "TripAdvisor Scraper API"
3. Subscribe to the free plan (or your preferred tier)
4. Go to your API key section and copy your **API Key**
5. Copy the **API Host** (usually `tripadvisor-scraper-api.omkar.cloud`)

### 2. Setup MySQL Database

#### Option A: Local MySQL Installation

```bash
# macOS (using Homebrew)
brew install mysql
brew services start mysql

# Windows
# Download from https://dev.mysql.com/downloads/mysql/
# Or use Docker (see below)

# Linux (Ubuntu/Debian)
sudo apt-get install mysql-server
sudo systemctl start mysql
```

#### Option B: Using Docker (Recommended)

```bash
# Create and run MySQL container
docker run --name travel-planner-db \
  -e MYSQL_ROOT_PASSWORD=yourpassword \
  -e MYSQL_DATABASE=travel_planner \
  -p 3306:3306 \
  -d mysql:8.0

# Verify connection
mysql -h localhost -u root -p -e "SELECT VERSION();"
```

### 3. Create Environment Files

#### Backend Environment (.env)

Navigate to `server/` directory and create `.env`:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword      # Change this to your MySQL password
DB_NAME=travel_planner
PORT=5000

# API Configuration
TRIPADVISOR_API_KEY=your_rapidapi_key_here
TRIPADVISOR_LOCALE=en-US
TRIPADVISOR_CURRENCY=INR
TRIPADVISOR_MAX_PAGES=2
```

#### Frontend Environment (.env.local)

In root directory, create `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Verify MySQL Connection

```bash
# Test connection from command line
mysql -h localhost -u root -p travel_planner

# Inside MySQL shell
mysql> SHOW DATABASES;
mysql> USE travel_planner;
mysql> SHOW TABLES;
mysql> EXIT;
```

### 5. Environment Variable Guide

#### Database Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL server hostname | `localhost` or `127.0.0.1` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `securepass123` |
| `DB_NAME` | Database name | `travel_planner` |
| `PORT` | Backend server port | `5000` |

#### API Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `TRIPADVISOR_API_KEY` | RapidAPI key | `abc123xyz...` |
| `TRIPADVISOR_LOCALE` | Language/locale | `en-US` |
| `TRIPADVISOR_CURRENCY` | Currency code | `INR`, `USD`, `EUR` |
| `TRIPADVISOR_MAX_PAGES` | Max pages to fetch | `2` (1-5 recommended) |

---

## Installation & Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install frontend dependencies (already installed via root)
```

### 2. Initialize Database

The database schema will be created automatically on first server startup, but you can also run it manually:

```bash
cd server
# The schema will be created when server starts
npm run dev
```

### 3. Seed Sample Data (Optional)

To pre-populate the database with sample cities and places:

```bash
cd server

# Add seed script to package.json if not present
# Then run:
npm run seed
```

Or update `server/package.json`:

```json
{
  "scripts": {
    "seed": "ts-node-dev --transpile-only seed.ts"
  }
}
```

### 4. Start the Application

#### Terminal 1 - Backend Server

```bash
cd server
npm run dev
# Output: ✓ Server running on port 5000
```

#### Terminal 2 - Frontend Development Server

```bash
npm run dev
# Output: VITE v... ready in ... ms
```

Visit `http://localhost:5173` in your browser.

---

## Verification Checklist

- [ ] MySQL is running and accessible
- [ ] `.env` file is created with correct database credentials
- [ ] `.env.local` file created with `VITE_API_URL`
- [ ] `TRIPADVISOR_API_KEY` is set in `.env`
- [ ] Backend starts without errors: `npm run dev` (in server/)
- [ ] Frontend starts without errors: `npm run dev` (in root)
- [ ] API is accessible: `http://localhost:5000/api/health`
- [ ] Database tables were created: Check MySQL
- [ ] First search works and caches data

---

## Database Connection Testing

### Test Connection from Node.js

```bash
cd server
node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'yourpassword',
  database: 'travel_planner'
});
pool.getConnection().then(conn => {
  console.log('✓ Connected to database');
  conn.release();
  process.exit(0);
}).catch(err => {
  console.error('✗ Connection failed:', err.message);
  process.exit(1);
});
"
```

### Test API Health Check

```bash
curl http://localhost:5000/health
# Expected output:
# {"status":"ok"}
```

---

## Advanced Configuration

### Custom Database Host

```env
# For remote database (cloud hosted)
DB_HOST=your-cloud-db.region.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=yourpassword
```

### Different Locale/Currency

```env
# For Spanish users
TRIPADVISOR_LOCALE=es-ES
TRIPADVISOR_CURRENCY=EUR

# For UK users
TRIPADVISOR_LOCALE=en-GB
TRIPADVISOR_CURRENCY=GBP
```

### Adjust API Limits

```env
# Fetch more pages (slower but more results)
TRIPADVISOR_MAX_PAGES=5

# Fetch fewer pages (faster but fewer results)
TRIPADVISOR_MAX_PAGES=1
```

---

## Troubleshooting

### MySQL Connection Error: "ECONNREFUSED"

```bash
# Check if MySQL is running
# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Windows
net start MySQL80

# Start MySQL if not running
brew services start mysql
# or
sudo systemctl start mysql
```

### API Key Not Working

1. Verify API key is correct in `.env`
2. Check RapidAPI account is active
3. Verify subscription is valid (free tier usually OK)
4. Test API key directly on RapidAPI dashboard
5. Regenerate key and update `.env`

### Database Already Exists Error

```bash
# If schema conflicts occur
mysql -u root -p -e "DROP DATABASE travel_planner;"
# Restart server to recreate schema
```

### Port Already in Use

```bash
# If port 5000 is in use, change in .env
PORT=3001

# Or find and kill process using port 5000
lsof -i :5000
kill -9 <PID>
```

### CORS Errors

Ensure frontend `.env.local` has correct API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Security Notes

⚠️ **Important for Production:**

1. **Never commit `.env` file** - Add to `.gitignore`:
   ```
   .env
   .env.local
   .env.*.local
   ```

2. **Use strong database password**:
   ```env
   DB_PASSWORD=use_a_strong_random_password_here_not_simple
   ```

3. **Rotate API keys regularly** on RapidAPI dashboard

4. **Use environment-specific configs**:
   ```
   .env.development
   .env.production
   .env.test
   ```

5. **Never expose API keys in frontend** - Only store in backend `.env`

---

## Domain-Specific Configuration

### For India-Based Users
```env
TRIPADVISOR_LOCALE=en-IN
TRIPADVISOR_CURRENCY=INR
```

### For US-Based Users
```env
TRIPADVISOR_LOCALE=en-US
TRIPADVISOR_CURRENCY=USD
```

### For European Users
```env
TRIPADVISOR_LOCALE=en-GB
TRIPADVISOR_CURRENCY=EUR
```

---

## Performance Tuning

### Database Connection Pool

Edit `server/lib/mysql.ts`:

```typescript
const pool = mysql.createPool({
  // ... other options
  connectionLimit: 10,      // Increase for higher concurrency
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
```

### API Rate Limiting

RapidAPI free tier usually allows:
- ~500 requests/month (free tier)
- Higher limits available with paid subscription

To check limits, visit your RapidAPI dashboard.

---

## Docker Setup (Alternative)

### Full Stack with Docker

`docker-compose.yml`:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: travel_planner
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: rootpass
      DB_NAME: travel_planner
      TRIPADVISOR_API_KEY: ${TRIPADVISOR_API_KEY}
    depends_on:
      - mysql

  frontend:
    build: .
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:5000/api

volumes:
  mysql_data:
```

Run with:

```bash
docker-compose up
```

---

## Next Steps

1. ✅ Setup environment variables
2. ✅ Initialize database
3. ✅ Start backend server
4. ✅ Start frontend application
5. 🔍 Search for a city to test caching mechanism
6. 📊 Check database for cached places
7. 🚀 Deploy to production with appropriate configurations

---

## Support

If you encounter issues:

1. Check console for error messages
2. Verify all `.env` variables are set
3. Ensure MySQL is running and accessible
4. Check API key is valid on RapidAPI
5. Review logs in browser DevTools and server console
