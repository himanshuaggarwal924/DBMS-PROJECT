# Quick Start Guide

## 🚀 Start Here

### Step 1: Setup MySQL Database

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p
```
Then paste:
```sql
CREATE DATABASE travel_planner;
USE travel_planner;
-- Run the schema from server/schema.sql
SOURCE server/schema.sql;
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Create new database: `travel_planner`
3. Open `server/schema.sql` 
4. Execute the file

---

### Step 2: Configure Backend

Edit `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=travel_planner
JWT_SECRET=any_random_secret_key_123
PORT=5000
```

---

### Step 3: Start Backend

```bash
cd server
npm install
npm run dev
```

Expected output:
```
[INFO] ts-node-dev ver. 2.0.0
Server running on port 5000
Connected to MySQL database
```

---

### Step 4: Start Frontend (New Terminal)

```bash
npm install
npm run dev
```

Expected output:
```
  VITE v8.0.0  ready in 543 ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 5: Access the Application

Open browser and go to: **http://localhost:5173**

---

## ✅ Verify Everything Works

1. **Frontend Loads** - See "Discover Your Next Great Adventure"
2. **Register Account** - Click "Sign In" → "Create one" → Fill form → Sign up
3. **Login** - Use credentials you just created
4. **Browse Cities** - Explore popular destinations
5. **Check Backend Logs** - Verify API requests in terminal

---

## 🔧 Troubleshooting

### MySQL Not Running?
```bash
# Windows
net start MySQL80

# macOS
brew services start mysql

# Linux  
sudo systemctl start mysql
```

### Port 5000 Already in Use?
Edit `server/.env` and change `PORT=6000`

### "Cannot find module" Error?
```bash
# Frontend
rm -r node_modules package-lock.json
npm install

# Backend
cd server
rm -r node_modules package-lock.json
npm install
```

### Database Connection Failed?
1. Verify MySQL is running
2. Check `server/.env` credentials
3. Ensure database exists: `SHOW DATABASES;`

---

## 📝 Sample Test Data

Add test data to database:

```sql
-- Add test user
INSERT INTO users (username, email, password) 
VALUES ('testuser', 'test@test.com', 'hashedpassword');

-- Add test city
INSERT INTO cities (name, country, state, imageUrl, description) 
VALUES ('Goa', 'India', 'Goa', 'https://...', 'Beautiful beach destination');

-- Add test places
INSERT INTO places (name, city, type, rating, address, description) 
VALUES 
('The Taj Hotel', 'Goa', 'hotel', 4.5, '123 Beach Road', 'Luxury 5-star hotel'),
('Casa Piccola', 'Goa', 'restaurant', 4.2, '45 Main Street', 'Italian restaurant');
```

---

## 📂 Project Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main React app |
| `src/api-client-react.ts` | API hooks & types |
| `src/pages/*` | Page components |
| `server/server.ts` | Express server |
| `server/routes/*` | API endpoints |
| `server/schema.sql` | Database structure |
| `.env.local` | Frontend config |
| `server/.env` | Backend config |

---

## 🎯 What's Working

✅ User Registration & Login  
✅ City Search & Discovery  
✅ Place Browsing (Hotels, Restaurants, Attractions)  
✅ Reviews & Ratings  
✅ Favorites/Wishlist  
✅ Trip Planning  
✅ Analytics Dashboard  
✅ Responsive Design  

---

## 📚 Next Steps

1. Add real data to database
2. Integrate RapidAPI for live travel data
3. Deploy to production (Vercel/Netlify for frontend, Render/Railway for backend)
4. Add more features (image uploads, notifications, etc.)

---

## 💡 Tips

- Use **Postman** to test API endpoints
- Check **browser/server console** for errors
- Use **MySQL Workbench** to view database
- React DevTools extension helps debug frontend
- Keep both terminals running together

Happy travels! 🌍✈️
