import dotenv from "dotenv";
import mysql from "mysql2/promise";
import type { PoolConnection } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type { PoolConnection };

dotenv.config();

export type SqlValue = string | number | boolean | Date | null;

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

export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}

export async function queryRows<T extends RowDataPacket[]>(
  sql: string,
  values: SqlValue[] = []
): Promise<T> {
  const [rows] = await pool.query<T>(sql, values);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  values: SqlValue[] = []
): Promise<T | null> {
  const rows = await queryRows<T[]>(sql, values);
  return rows[0] || null;
}

export async function execute(sql: string, values: SqlValue[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result;
}

export async function closePool() {
  await pool.end();
}

export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function withAdvisoryLock<T>(
  lockName: string,
  timeoutSecs: number,
  fn: () => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT GET_LOCK(?, ?) AS acquired",
      [lockName, timeoutSecs]
    );
    if (!rows[0]?.acquired) {
      throw new Error(`Could not acquire advisory lock: ${lockName}`);
    }
    try {
      return await fn();
    } finally {
      await conn.query("SELECT RELEASE_LOCK(?)", [lockName]);
    }
  } finally {
    conn.release();
  }
}

export default pool;
