import { Router, type IRouter } from "express";
import type { RowDataPacket } from "mysql2";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { execute, queryOne, queryRows, withTransaction } from "../lib/mysql";
import { buildDistanceExpression, ensureCityExists } from "../lib/place-utils";

const router: IRouter = Router();

interface TripRow extends RowDataPacket {
  trip_id: number;
  user_id: number;
  city_id: number;
  city_name: string;
  planned_budget: number | string;
  start_date: string | Date;
  end_date: string | Date;
  created_at: string | Date;
}

interface TripPlaceRow extends RowDataPacket {
  id: number;
  trip_id: number;
  place_id: number;
  day_number: number;
  visit_order: number;
  planned_cost?: number | string | null;
  name: string;
  avg_cost?: number | string | null;
  rating?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  category_name: string;
  address?: string | null;
  image_url?: string | null;
  city_name: string;
}

interface ExpenseRow extends RowDataPacket {
  id: number;
  trip_id: number;
  place_id?: number | null;
  amount: number | string;
  category: "food" | "travel" | "shopping" | "tickets" | "other";
  spent_date: string | Date;
  note?: string | null;
  place_name?: string | null;
}

interface BudgetRow extends RowDataPacket {
  planned_budget: number | string;
  itinerary_planned_cost: number | string | null;
  actual_expenses: number | string | null;
}

interface ExpenseCategoryRow extends RowDataPacket {
  category: string;
  total: number | string;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function formatTrip(trip: TripRow) {
  return {
    id: trip.trip_id,
    userId: trip.user_id,
    cityId: trip.city_id,
    cityName: trip.city_name,
    plannedBudget: toNumber(trip.planned_budget) ?? 0,
    startDate: trip.start_date,
    endDate: trip.end_date,
    createdAt: trip.created_at,
  };
}

function formatTripPlace(place: TripPlaceRow) {
  return {
    id: place.id,
    tripId: place.trip_id,
    placeId: place.place_id,
    dayNumber: place.day_number,
    visitOrder: place.visit_order,
    plannedCost: toNumber(place.planned_cost) ?? null,
    place: {
      id: place.place_id,
      name: place.name,
      avgCost: toNumber(place.avg_cost) ?? null,
      priceLevel: toNumber(place.avg_cost) ?? null,
      rating: toNumber(place.rating) ?? null,
      latitude: toNumber(place.latitude) ?? null,
      longitude: toNumber(place.longitude) ?? null,
      category: place.category_name,
      type: place.category_name.toLowerCase(),
      address: place.address || "",
      imageUrl: place.image_url || "",
      cityName: place.city_name,
    },
  };
}

function formatExpense(expense: ExpenseRow) {
  return {
    id: expense.id,
    tripId: expense.trip_id,
    placeId: expense.place_id ?? null,
    placeName: expense.place_name || null,
    amount: toNumber(expense.amount) ?? 0,
    category: expense.category,
    spentDate: expense.spent_date,
    note: expense.note || "",
  };
}

async function getOwnedTrip(tripId: number, userId: number) {
  return queryOne<TripRow>(
    `SELECT
       t.trip_id,
       t.user_id,
       t.city_id,
       city.name AS city_name,
       t.planned_budget,
       t.start_date,
       t.end_date,
       t.created_at
     FROM trips t
     JOIN cities city ON city.city_id = t.city_id
     WHERE t.trip_id = ? AND t.user_id = ?`,
    [tripId, userId]
  );
}

async function getTripPlaces(tripId: number) {
  return queryRows<TripPlaceRow[]>(
    `SELECT
       tp.id,
       tp.trip_id,
       tp.place_id,
       tp.day_number,
       tp.visit_order,
       tp.planned_cost,
       p.name,
       p.avg_cost,
       p.rating,
       p.latitude,
       p.longitude,
       c.name AS category_name,
       p.address,
       p.image_url,
       city.name AS city_name
     FROM trip_places tp
     JOIN places p ON p.place_id = tp.place_id
     JOIN categories c ON c.category_id = p.category_id
     JOIN cities city ON city.city_id = p.city_id
     WHERE tp.trip_id = ?
     ORDER BY tp.day_number ASC, tp.visit_order ASC`,
    [tripId]
  );
}

async function getTripExpenses(tripId: number) {
  return queryRows<ExpenseRow[]>(
    `SELECT
       e.id,
       e.trip_id,
       e.place_id,
       e.amount,
       e.category,
       e.spent_date,
       e.note,
       p.name AS place_name
     FROM expenses e
     LEFT JOIN places p ON p.place_id = e.place_id
     WHERE e.trip_id = ?
     ORDER BY e.spent_date DESC, e.id DESC`,
    [tripId]
  );
}

async function getTripBudgetDashboard(tripId: number) {
  const summary = await queryOne<BudgetRow>(
    `SELECT
       t.planned_budget,
       COALESCE(SUM(tp.planned_cost), 0) AS itinerary_planned_cost,
       (
         SELECT COALESCE(SUM(e.amount), 0)
         FROM expenses e
         WHERE e.trip_id = t.trip_id
       ) AS actual_expenses
     FROM trips t
     LEFT JOIN trip_places tp ON tp.trip_id = t.trip_id
     WHERE t.trip_id = ?
     GROUP BY t.trip_id, t.planned_budget`,
    [tripId]
  );

  const byCategory = await queryRows<ExpenseCategoryRow[]>(
    `SELECT category, SUM(amount) AS total
     FROM expenses
     WHERE trip_id = ?
     GROUP BY category
     ORDER BY total DESC`,
    [tripId]
  );

  const plannedBudget = toNumber(summary?.planned_budget) ?? 0;
  const itineraryPlannedCost = toNumber(summary?.itinerary_planned_cost) ?? 0;
  const actualExpenses = toNumber(summary?.actual_expenses) ?? 0;

  return {
    plannedBudget,
    itineraryPlannedCost,
    actualExpenses,
    remainingBudget: plannedBudget - actualExpenses,
    byCategory: byCategory.map((row) => ({
      category: row.category,
      total: toNumber(row.total) ?? 0,
    })),
  };
}

function groupItineraryByDay(rows: TripPlaceRow[]) {
  const grouped = new Map<number, ReturnType<typeof formatTripPlace>[]>();

  for (const row of rows) {
    const formatted = formatTripPlace(row);
    const dayItems = grouped.get(formatted.dayNumber) || [];
    dayItems.push(formatted);
    grouped.set(formatted.dayNumber, dayItems);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([dayNumber, places]) => ({
      dayNumber,
      places,
    }));
}

router.use(requireAuth);

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const trips = await queryRows<TripRow[]>(
      `SELECT
         t.trip_id,
         t.user_id,
         t.city_id,
         city.name AS city_name,
         t.planned_budget,
         t.start_date,
         t.end_date,
         t.created_at
       FROM trips t
       JOIN cities city ON city.city_id = t.city_id
       WHERE t.user_id = ?
       ORDER BY t.start_date ASC, t.trip_id DESC`,
      [req.auth!.userId]
    );

    const tripIds = trips.map((trip) => trip.trip_id);
    const budgets = await Promise.all(tripIds.map((tripId) => getTripBudgetDashboard(tripId)));

    res.json(
      trips.map((trip, index) => ({
        ...formatTrip(trip),
        budget: budgets[index],
      }))
    );
  } catch (error) {
    console.error("List trips error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const { cityId, cityName, plannedBudget, startDate, endDate } = req.body as {
      cityId?: number;
      cityName?: string;
      plannedBudget?: number;
      startDate?: string;
      endDate?: string;
    };

    if ((!cityId && !cityName) || !startDate || !endDate) {
      res.status(400).json({ message: "cityId or cityName, startDate, and endDate are required" });
      return;
    }

    const resolvedCityId = cityId
      ? cityId
      : (await ensureCityExists(cityName!)).city_id;

    const result = await execute(
      `INSERT INTO trips (user_id, city_id, planned_budget, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [req.auth!.userId, resolvedCityId, plannedBudget ?? 0, startDate, endDate]
    );

    const trip = await getOwnedTrip(result.insertId, req.auth!.userId);
    if (!trip) {
      res.status(500).json({ message: "Failed to load created trip" });
      return;
    }

    res.status(201).json({
      ...formatTrip(trip),
      itineraryByDay: [],
      expenses: [],
      budget: await getTripBudgetDashboard(trip.trip_id),
    });
  } catch (error) {
    console.error("Create trip error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:tripId", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    if (!Number.isFinite(tripId)) {
      res.status(400).json({ message: "Valid tripId is required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const [tripPlaces, expenses, budget] = await Promise.all([
      getTripPlaces(tripId),
      getTripExpenses(tripId),
      getTripBudgetDashboard(tripId),
    ]);

    res.json({
      ...formatTrip(trip),
      itinerary: tripPlaces.map(formatTripPlace),
      itineraryByDay: groupItineraryByDay(tripPlaces),
      expenses: expenses.map(formatExpense),
      budget,
    });
  } catch (error) {
    console.error("Get trip detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:tripId", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    if (!Number.isFinite(tripId)) {
      res.status(400).json({ message: "Valid tripId is required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    await execute("DELETE FROM trips WHERE trip_id = ? AND user_id = ?", [tripId, req.auth!.userId]);
    res.json({ message: "Trip deleted" });
  } catch (error) {
    console.error("Delete trip error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:tripId/places", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const { placeId, dayNumber, visitOrder, plannedCost } = req.body as {
      placeId?: number;
      dayNumber?: number;
      visitOrder?: number;
      plannedCost?: number;
    };

    if (!Number.isFinite(tripId) || !placeId || !dayNumber) {
      res.status(400).json({ message: "tripId, placeId, and dayNumber are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const orderToUse =
      visitOrder ||
      (
        toNumber(
          (
            await queryOne<RowDataPacket & { max_order: number | string }>(
              "SELECT COALESCE(MAX(visit_order), 0) AS max_order FROM trip_places WHERE trip_id = ? AND day_number = ?",
              [tripId, dayNumber]
            )
          )?.max_order
        ) ?? 0
      ) +
        1;

    await execute(
      `INSERT INTO trip_places (trip_id, place_id, day_number, visit_order, planned_cost)
       VALUES (?, ?, ?, ?, ?)`,
      [tripId, placeId, dayNumber, orderToUse, plannedCost ?? null]
    );

    const tripPlaces = await getTripPlaces(tripId);
    res.status(201).json({
      itinerary: tripPlaces.map(formatTripPlace),
      itineraryByDay: groupItineraryByDay(tripPlaces),
    });
  } catch (error) {
    console.error("Add trip place error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:tripId/places/:tripPlaceId", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const tripPlaceId = Number.parseInt(req.params.tripPlaceId, 10);
    const { dayNumber, visitOrder, plannedCost } = req.body as {
      dayNumber?: number;
      visitOrder?: number;
      plannedCost?: number | null;
    };

    if (!Number.isFinite(tripId) || !Number.isFinite(tripPlaceId)) {
      res.status(400).json({ message: "Valid tripId and tripPlaceId are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    await execute(
      `UPDATE trip_places
       SET day_number = COALESCE(?, day_number),
           visit_order = COALESCE(?, visit_order),
           planned_cost = ?
       WHERE id = ? AND trip_id = ?`,
      [dayNumber ?? null, visitOrder ?? null, plannedCost ?? null, tripPlaceId, tripId]
    );

    const tripPlaces = await getTripPlaces(tripId);
    res.json({
      itinerary: tripPlaces.map(formatTripPlace),
      itineraryByDay: groupItineraryByDay(tripPlaces),
    });
  } catch (error) {
    console.error("Update trip place error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:tripId/days/:dayNumber/reorder", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const dayNumber = Number.parseInt(req.params.dayNumber, 10);
    const { orderedTripPlaceIds } = req.body as { orderedTripPlaceIds?: unknown };

    if (!Number.isFinite(tripId) || !Number.isFinite(dayNumber) || !Array.isArray(orderedTripPlaceIds)) {
      res.status(400).json({ message: "tripId, dayNumber, and orderedTripPlaceIds array are required" });
      return;
    }

    const ids = orderedTripPlaceIds.map(Number).filter(Number.isFinite);

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    await withTransaction(async (conn) => {
      // Move to temp range first to avoid unique-constraint conflicts during swap
      for (let i = 0; i < ids.length; i++) {
        await conn.execute(
          "UPDATE trip_places SET visit_order = ? WHERE id = ? AND trip_id = ? AND day_number = ?",
          [10000 + i, ids[i], tripId, dayNumber]
        );
      }
      for (let i = 0; i < ids.length; i++) {
        await conn.execute(
          "UPDATE trip_places SET visit_order = ? WHERE id = ? AND trip_id = ? AND day_number = ?",
          [i + 1, ids[i], tripId, dayNumber]
        );
      }
    });

    const tripPlaces = await getTripPlaces(tripId);
    res.json({
      itinerary: tripPlaces.map(formatTripPlace),
      itineraryByDay: groupItineraryByDay(tripPlaces),
    });
  } catch (error) {
    console.error("Reorder trip day error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:tripId/places/:tripPlaceId", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const tripPlaceId = Number.parseInt(req.params.tripPlaceId, 10);
    if (!Number.isFinite(tripId) || !Number.isFinite(tripPlaceId)) {
      res.status(400).json({ message: "Valid tripId and tripPlaceId are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    await execute("DELETE FROM trip_places WHERE id = ? AND trip_id = ?", [tripPlaceId, tripId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete trip place error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:tripId/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    if (!Number.isFinite(tripId)) {
      res.status(400).json({ message: "Valid tripId is required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const expenses = await getTripExpenses(tripId);
    res.json(expenses.map(formatExpense));
  } catch (error) {
    console.error("Get trip expenses error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:tripId/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const { placeId, amount, category, spentDate, note } = req.body as {
      placeId?: number | null;
      amount?: number;
      category?: ExpenseRow["category"];
      spentDate?: string;
      note?: string;
    };

    if (!Number.isFinite(tripId) || typeof amount !== "number" || !category || !spentDate) {
      res.status(400).json({ message: "tripId, amount, category, and spentDate are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const result = await execute(
      `INSERT INTO expenses (trip_id, place_id, amount, category, spent_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tripId, placeId ?? null, amount, category, spentDate, note ?? null]
    );

    const expense = await queryOne<ExpenseRow>(
      `SELECT
         e.id,
         e.trip_id,
         e.place_id,
         e.amount,
         e.category,
         e.spent_date,
         e.note,
         p.name AS place_name
       FROM expenses e
       LEFT JOIN places p ON p.place_id = e.place_id
       WHERE e.id = ?`,
      [result.insertId]
    );

    res.status(201).json(formatExpense(expense!));
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:tripId/expenses/:expenseId", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const expenseId = Number.parseInt(req.params.expenseId, 10);
    const { placeId, amount, category, spentDate, note } = req.body as {
      placeId?: number | null;
      amount?: number;
      category?: ExpenseRow["category"];
      spentDate?: string;
      note?: string;
    };

    if (!Number.isFinite(tripId) || !Number.isFinite(expenseId)) {
      res.status(400).json({ message: "Valid tripId and expenseId are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    await execute(
      `UPDATE expenses
       SET place_id = ?,
           amount = COALESCE(?, amount),
           category = COALESCE(?, category),
           spent_date = COALESCE(?, spent_date),
           note = ?
       WHERE id = ? AND trip_id = ?`,
      [placeId ?? null, amount ?? null, category ?? null, spentDate ?? null, note ?? null, expenseId, tripId]
    );

    const expense = await queryOne<ExpenseRow>(
      `SELECT
         e.id,
         e.trip_id,
         e.place_id,
         e.amount,
         e.category,
         e.spent_date,
         e.note,
         p.name AS place_name
       FROM expenses e
       LEFT JOIN places p ON p.place_id = e.place_id
       WHERE e.id = ? AND e.trip_id = ?`,
      [expenseId, tripId]
    );

    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    res.json(formatExpense(expense));
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:tripId/expenses/:expenseId", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const expenseId = Number.parseInt(req.params.expenseId, 10);
    if (!Number.isFinite(tripId) || !Number.isFinite(expenseId)) {
      res.status(400).json({ message: "Valid tripId and expenseId are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    await execute("DELETE FROM expenses WHERE id = ? AND trip_id = ?", [expenseId, tripId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:tripId/budget-dashboard", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    if (!Number.isFinite(tripId)) {
      res.status(400).json({ message: "Valid tripId is required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    res.json(await getTripBudgetDashboard(tripId));
  } catch (error) {
    console.error("Get budget dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:tripId/optimize-day", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const dayNumber = Number.parseInt(String(req.body.dayNumber || ""), 10);
    const referenceLat = typeof req.body.referenceLat === "number" ? req.body.referenceLat : undefined;
    const referenceLng = typeof req.body.referenceLng === "number" ? req.body.referenceLng : undefined;

    if (!Number.isFinite(tripId) || !Number.isFinite(dayNumber)) {
      res.status(400).json({ message: "Valid tripId and dayNumber are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const anchor =
      typeof referenceLat === "number" && typeof referenceLng === "number"
        ? { latitude: referenceLat, longitude: referenceLng }
        : await queryOne<RowDataPacket & { latitude: number | string; longitude: number | string }>(
            `SELECT p.latitude, p.longitude
             FROM trip_places tp
             JOIN places p ON p.place_id = tp.place_id
             WHERE tp.trip_id = ? AND tp.day_number = ?
             ORDER BY tp.visit_order ASC
             LIMIT 1`,
            [tripId, dayNumber]
          );

    const anchorLat = toNumber(anchor?.latitude);
    const anchorLng = toNumber(anchor?.longitude);
    if (anchorLat === undefined || anchorLng === undefined) {
      res.status(400).json({ message: "A reference point is required to optimize this day" });
      return;
    }

    await execute(
      "UPDATE trip_places SET visit_order = visit_order + 1000 WHERE trip_id = ? AND day_number = ?",
      [tripId, dayNumber]
    );

    const distanceExpression = buildDistanceExpression("p.latitude", "p.longitude");
    await execute(
      `UPDATE trip_places tp
       JOIN (
         SELECT
           tp_inner.id,
           ROW_NUMBER() OVER (
             ORDER BY ${distanceExpression} ASC, tp_inner.id ASC
           ) AS new_order
         FROM trip_places tp_inner
         JOIN places p ON p.place_id = tp_inner.place_id
         WHERE tp_inner.trip_id = ? AND tp_inner.day_number = ?
       ) ranked ON ranked.id = tp.id
       SET tp.visit_order = ranked.new_order
       WHERE tp.trip_id = ? AND tp.day_number = ?`,
      [anchorLat, anchorLng, anchorLat, tripId, dayNumber, tripId, dayNumber]
    );

    const tripPlaces = await getTripPlaces(tripId);
    res.json({
      itinerary: tripPlaces.map(formatTripPlace),
      itineraryByDay: groupItineraryByDay(tripPlaces),
    });
  } catch (error) {
    console.error("Optimize trip day error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:tripId/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    if (!Number.isFinite(tripId)) {
      res.status(400).json({ message: "Valid tripId is required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const expenses = await getTripExpenses(tripId);
    res.json(expenses.map(formatExpense));
  } catch (error) {
    console.error("List expenses error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:tripId/expenses", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const { placeId, amount, category, spentDate, note } = req.body as {
      placeId?: number | null;
      amount?: number;
      category?: "food" | "travel" | "shopping" | "tickets" | "other";
      spentDate?: string;
      note?: string;
    };

    if (!Number.isFinite(tripId) || typeof amount !== "number" || !category || !spentDate) {
      res.status(400).json({ message: "tripId, amount, category, and spentDate are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    const result = await execute(
      `INSERT INTO expenses (trip_id, place_id, amount, category, spent_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tripId, placeId ?? null, amount, category, spentDate, note || null]
    );

    const expense = await queryOne<ExpenseRow>(
      `SELECT
         e.id,
         e.trip_id,
         e.place_id,
         e.amount,
         e.category,
         e.spent_date,
         e.note,
         p.name AS place_name
       FROM expenses e
       LEFT JOIN places p ON p.place_id = e.place_id
       WHERE e.id = ?`,
      [result.insertId]
    );

    res.status(201).json(expense ? formatExpense(expense) : null);
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:tripId/expenses/:expenseId", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    const expenseId = Number.parseInt(req.params.expenseId, 10);
    if (!Number.isFinite(tripId) || !Number.isFinite(expenseId)) {
      res.status(400).json({ message: "Valid tripId and expenseId are required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    await execute("DELETE FROM expenses WHERE id = ? AND trip_id = ?", [expenseId, tripId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:tripId/budget-dashboard", async (req: AuthenticatedRequest, res) => {
  try {
    const tripId = Number.parseInt(req.params.tripId, 10);
    if (!Number.isFinite(tripId)) {
      res.status(400).json({ message: "Valid tripId is required" });
      return;
    }

    const trip = await getOwnedTrip(tripId, req.auth!.userId);
    if (!trip) {
      res.status(404).json({ message: "Trip not found" });
      return;
    }

    res.json(await getTripBudgetDashboard(tripId));
  } catch (error) {
    console.error("Budget dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
