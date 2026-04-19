import dotenv from "dotenv";
import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import { initializeDatabase } from "./db";
import { closePool, execute, queryOne } from "./lib/mysql";

dotenv.config();

const BCRYPT_ROUNDS = 10;
const adminEmail = process.env.ADMIN_EMAIL || "admin@travelplanner.local";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
const adminName = process.env.ADMIN_NAME || "Travel Admin";

async function seedAdmin() {
  await initializeDatabase();

  const existingAdmin = await queryOne<RowDataPacket & { user_id: number }>(
    "SELECT user_id FROM users WHERE role = 'admin' LIMIT 1"
  );

  if (existingAdmin) {
    console.log(`Admin already exists with user_id ${existingAdmin.user_id}`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
  const result = await execute(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')`,
    [adminName, adminEmail.toLowerCase(), passwordHash]
  );

  console.log(`Created admin user ${adminEmail} with user_id ${result.insertId}`);
}

seedAdmin()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
