import { Router, type IRouter } from "express";
import { queryOne, insert } from "../lib/mysql";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    const hash = hashPassword(password);
    const result = await insert(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash]
    );

    const user = await queryOne(
      "SELECT id, name, email, preferences, created_at as createdAt FROM users WHERE id = ?",
      [result]
    );

    res.status(201).json(user);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const hash = hashPassword(password);
    const user = await queryOne(
      "SELECT id, name, email, preferences, created_at as createdAt FROM users WHERE email = ? AND password_hash = ?",
      [email, hash]
    );

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await queryOne(
      "SELECT id, name, email, preferences, created_at as createdAt FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;