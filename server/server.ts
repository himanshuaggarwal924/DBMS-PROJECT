import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes     from "./routes/users";
import cityRoutes     from "./routes/cities";
import reviewRoutes   from "./routes/reviews";
import favoriteRoutes from "./routes/favorites";
import tripRoutes     from "./routes/trips";
import placeRoutes    from "./routes/places";
import analyticsRoutes from "./routes/analytics";
import itineraryRoutes from "./routes/itinerary";
import healthRoutes   from "./routes/health";
import { initializeDatabase } from "./db";

dotenv.config();

const app  = express();
const PORT = Number.parseInt(process.env.PORT || "5000", 10);

// ── CORS ────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ── Body parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));

// ── Security headers (lightweight, no helmet dep needed) ─────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── Request logger (dev only) ────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ───────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "WanderSync Travel Planner API", version: "1.0.0" });
});

app.use("/health",         healthRoutes);
app.use("/api/users",      userRoutes);
app.use("/api/cities",     cityRoutes);
app.use("/api/places",     placeRoutes);
app.use("/api/reviews",    reviewRoutes);
app.use("/api/favorites",  favoriteRoutes);
app.use("/api/trips",      tripRoutes);
app.use("/api/analytics",  analyticsRoutes);
app.use("/api/itinerary",  itineraryRoutes);

// ── 404 handler ──────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  // next must be declared to satisfy Express's 4-argument error-handler signature
  void next;
  if (err instanceof Error && err.message.startsWith("CORS")) {
    res.status(403).json({ message: err.message });
    return;
  }
  console.error("[Server Error]", err);
  res.status(500).json({ message: "Internal server error" });
});

// ── Startup ───────────────────────────────────────────────────────
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`✓ WanderSync API listening on http://localhost:${PORT}`);
      console.log(`  NODE_ENV      : ${process.env.NODE_ENV || "development"}`);
      console.log(`  Place API     : OpenStreetMap (Nominatim + Overpass)`);
      console.log(`  Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
