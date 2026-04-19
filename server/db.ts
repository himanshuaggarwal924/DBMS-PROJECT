import fs from "fs";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { getConnection } from "./lib/mysql";

interface ColumnRow extends RowDataPacket {
  COLUMN_NAME: string;
}

interface TableRow extends RowDataPacket {
  TABLE_NAME: string;
}

const CORE_TABLES = [
  "expenses",
  "user_searches",
  "reviews",
  "favorites",
  "trip_places",
  "trips",
  "places",
  "categories",
  "cities",
  "users",
];

function getSchemaPath() {
  const candidates = [
    path.join(__dirname, "schema.sql"),
    path.join(process.cwd(), "server", "schema.sql"),
    path.join(process.cwd(), "schema.sql"),
  ];

  const match = candidates.find((candidate) => fs.existsSync(candidate));
  if (!match) {
    throw new Error("Unable to locate server/schema.sql");
  }

  return match;
}

async function tableHasColumn(tableName: string, columnName: string) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query<ColumnRow[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );

    return rows.length > 0;
  } finally {
    connection.release();
  }
}

async function tableExists(tableName: string) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query<TableRow[]>(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?`,
      [tableName]
    );

    return rows.length > 0;
  } finally {
    connection.release();
  }
}

async function resetLegacySchema() {
  const connection = await getConnection();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const tableName of CORE_TABLES) {
      await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  } finally {
    connection.release();
  }
}

export async function initializeDatabase() {
  const usersTableExists      = await tableExists("users").catch(() => false);
  const placesTableExists     = await tableExists("places").catch(() => false);
  const tripPlacesTableExists = await tableExists("trip_places").catch(() => false);

  const usersHaveExpectedKey      = await tableHasColumn("users",       "user_id").catch(() => false);
  const placesHaveExpectedKey     = await tableHasColumn("places",      "place_id").catch(() => false);
  const tripPlacesHaveDayNumber   = await tableHasColumn("trip_places", "day_number").catch(() => false);

  // Columns added in the current schema that older DB setups won't have.
  // If any are missing the whole schema needs to be recreated.
  const placesHaveApiPlaceId      = await tableHasColumn("places", "api_place_id").catch(() => false);
  const placesHavePopularity      = await tableHasColumn("places", "popularity_score").catch(() => false);
  const placesHaveImageUrl        = await tableHasColumn("places", "image_url").catch(() => false);

  const needsReset =
    (usersTableExists       && !usersHaveExpectedKey)    ||
    (placesTableExists      && !placesHaveExpectedKey)   ||
    (tripPlacesTableExists  && !tripPlacesHaveDayNumber) ||
    // Old schema is missing columns that current queries depend on
    (placesTableExists      && (!placesHaveApiPlaceId || !placesHavePopularity || !placesHaveImageUrl));

  if (needsReset) {
    console.log("[DB] Schema mismatch detected — recreating tables from schema.sql …");
    await resetLegacySchema();
  }

  const schema = fs.readFileSync(getSchemaPath(), "utf8");
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  const connection = await getConnection();
  try {
    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (error) {
        const typedError = error as { code?: string };
        if (typedError.code !== "ER_DUP_KEYNAME" && typedError.code !== "ER_TABLE_EXISTS_ERROR") {
          throw error;
        }
      }
    }
    await createStoredProcedures(connection);
  } finally {
    connection.release();
  }
}

async function createStoredProcedures(connection: Awaited<ReturnType<typeof getConnection>>) {
  try {
    await connection.query("DROP PROCEDURE IF EXISTS GetBestValuePlaces");
    await connection.query(`
      CREATE PROCEDURE GetBestValuePlaces(IN p_city_id INT, IN p_limit INT)
      BEGIN
        SELECT
          p.place_id,
          p.name,
          p.rating,
          p.avg_cost,
          c.name  AS category_name,
          city.name AS city_name,
          ROUND(p.rating / NULLIF(p.avg_cost, 0) * 1000, 2) AS value_score
        FROM places p
        JOIN categories c   ON c.category_id = p.category_id
        JOIN cities city     ON city.city_id  = p.city_id
        WHERE p.city_id = p_city_id
          AND p.rating   IS NOT NULL
          AND p.avg_cost IS NOT NULL
          AND p.avg_cost > 0
        ORDER BY value_score DESC
        LIMIT p_limit;
      END
    `);
    console.log("[DB] Stored procedure GetBestValuePlaces created");
  } catch (err) {
    console.warn("[DB] Failed to create stored procedure:", err instanceof Error ? err.message : err);
  }
}
