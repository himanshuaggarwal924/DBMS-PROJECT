import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ status: "unhealthy", message: "Server error" });
  }
});

export default router;
