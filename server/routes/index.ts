import { Router, type IRouter } from "express";
import healthRouter from "./health";
import citiesRouter from "./cities";
import placesRouter from "./places";
import usersRouter from "./users";
import reviewsRouter from "./reviews";
import favoritesRouter from "./favorites";
import tripsRouter from "./trips";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/cities", citiesRouter);
router.use("/places", placesRouter);
router.use("/users", usersRouter);
router.use("/reviews", reviewsRouter);
router.use("/favorites", favoritesRouter);
router.use("/trips", tripsRouter);
router.use("/analytics", analyticsRouter);

export default router;