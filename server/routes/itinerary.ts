import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({
    message: "Manage itineraries through /api/trips/:tripId and /api/trips/:tripId/places",
  });
});

export default router;
