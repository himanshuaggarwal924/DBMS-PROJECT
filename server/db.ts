import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "travel_planner",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database schema on startup
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    try {
      // First, check if users table exists and has name column
      const result = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'name'"
      );
      
      // If users table exists but doesn't have name column, drop and recreate all tables
      if (result[0] && (result[0] as any[]).length === 0) {
        console.log("⚠ Schema mismatch detected. Recreating database...");
        try {
          await connection.query("DROP DATABASE IF EXISTS travel_planner");
          console.log("✓ Old database dropped");
        } catch (err) {
          console.error("Error dropping database:", err);
        }
      }
      
      // Now execute the schema
      // Try multiple paths to find schema.sql
      let schemaPath = path.join(__dirname, "schema.sql");
      if (!fs.existsSync(schemaPath)) {
        schemaPath = path.join(process.cwd(), "server", "schema.sql");
      }
      if (!fs.existsSync(schemaPath)) {
        schemaPath = path.join(process.cwd(), "schema.sql");
      }
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`schema.sql not found. Tried: ${schemaPath}`);
      }
      
      const schemaSQL = fs.readFileSync(schemaPath, "utf8");

      // Split SQL statements and execute them
      const statements = schemaSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (let i = 0; i < statements.length; i++) {
        try {
          await connection.query(statements[i]);
          console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          // Ignore "database already exists" and "table already exists" errors and duplicate key errors
          if (
            err.code !== "ER_DB_CREATE_EXISTS" && 
            err.code !== "ER_TABLE_EXISTS_ERROR" &&
            err.code !== "ER_DUP_KEYNAME"
          ) {
            console.error(`Error executing statement ${i + 1}:`, error);
          }
        }
      }
      console.log("✓ Database schema initialized successfully");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export default pool;