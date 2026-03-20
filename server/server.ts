import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import cityRoutes from './routes/cities';
import reviewRoutes from './routes/reviews';
import favoriteRoutes from './routes/favorites';
import tripRoutes from './routes/trips';
import placeRoutes from './routes/places';
import analyticsRoutes from './routes/analytics';
import itineraryRoutes from './routes/itinerary';
import healthRoutes from './routes/health';
import { initializeDatabase } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.use('/health', healthRoutes);

// Routes
app.get('/', (req, res) => {
  res.send('Travel Planner API');
});

// API Routes - Mount routers at their base path
app.use('/api/users', userRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/itinerary', itineraryRoutes);

// Start server with database initialization
async function startServer() {
  try {
    console.log('🔧 Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized');

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();