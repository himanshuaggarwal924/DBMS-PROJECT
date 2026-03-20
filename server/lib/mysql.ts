import dotenv from 'dotenv';
import mysql from "mysql2/promise";
import type { RowDataPacket, OkPacket } from "mysql2";

// Load environment variables immediately
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "travel_planner",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on initialization
pool.getConnection().then(connection => {
  connection.ping().then(() => {
    console.log("✓ Database connection successful");
    connection.release();
  }).catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });
}).catch(err => {
  console.error("❌ Failed to get database connection:", err.message);
});

export async function query<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  values?: (string | number | boolean | null | undefined | unknown)[]
): Promise<T> {
  try {
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.query<T>(sql, values);
      return results as T;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function queryOne<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  values?: (string | number | boolean | null | undefined | unknown)[]
): Promise<T | null> {
  const results = await query<T[]>(sql, values);
  return (results?.[0] as T) || null;
}

export async function insert(sql: string, values?: (string | number | boolean | null | undefined | unknown)[]): Promise<number> {
  try {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query<OkPacket>(sql, values);
      return result.insertId;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database insert error:", error);
    throw error;
  }
}

export default pool;
