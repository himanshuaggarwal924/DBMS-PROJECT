import crypto from "crypto";
import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import type { RowDataPacket } from "mysql2";
import { execute, queryOne } from "../lib/mysql";
import { requireAuth, signAuthToken, type AuthenticatedRequest, type UserRole } from "../lib/auth";
import { sendPasswordResetEmail } from "../lib/mailer";

const router: IRouter = Router();
const RESET_TOKEN_TTL_MINUTES = 30;
const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: Date | string;
  reset_expiry?: Date | string | null;
}

function formatUser(row: UserRow) {
  return {
    id: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

function isValidPassword(password: string) {
  return typeof password === "string" && password.trim().length >= PASSWORD_MIN_LENGTH;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({ message: "Password must be at least 8 characters long" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await queryOne<UserRow>(
      "SELECT user_id, name, email, role, created_at FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = await queryOne<UserRow>(
      "SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?",
      [result.insertId]
    );

    if (!user) {
      res.status(500).json({ message: "Failed to load created user" });
      return;
    }

    const token = signAuthToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(201).json({
      user: formatUser(user),
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await queryOne<UserRow & { password_hash: string }>(
      "SELECT user_id, name, email, role, password_hash, created_at FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signAuthToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      user: formatUser(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await queryOne<UserRow>(
      "SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?",
      [req.auth!.userId]
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(formatUser(user));
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await queryOne<UserRow>(
      "SELECT user_id, name, email, role, created_at FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

      await execute(
        "UPDATE users SET reset_token = ?, reset_expiry = ? WHERE user_id = ?",
        [token, expiresAt, user.user_id]
      );

      const emailSent = await sendPasswordResetEmail(user.email, user.name, token);

      res.json({
        message: "If that email exists, a reset link has been sent.",
        // Only expose previewPath in dev when email is not configured
        previewPath:
          process.env.NODE_ENV !== "production" && !emailSent
            ? `/reset-password?token=${encodeURIComponent(token)}`
            : undefined,
        expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
      });
      return;
    }

    res.json({
      message: "If that email exists, a reset link has been sent.",
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/reset-password/validate", async (req, res) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      res.status(400).json({ message: "Reset token is required" });
      return;
    }

    const user = await queryOne<UserRow>(
      `SELECT user_id, name, email, role, created_at, reset_expiry
       FROM users
       WHERE reset_token = ?
         AND reset_expiry IS NOT NULL
         AND reset_expiry > NOW()`,
      [token]
    );

    if (!user) {
      res.status(400).json({ message: "This reset link is invalid or has expired." });
      return;
    }

    res.json({
      valid: true,
      email: user.email,
      expiresAt: user.reset_expiry,
    });
  } catch (error) {
    console.error("Validate reset token error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token?.trim()) {
      res.status(400).json({ message: "Reset token is required" });
      return;
    }

    if (!isValidPassword(password || "")) {
      res.status(400).json({ message: "Password must be at least 8 characters long" });
      return;
    }

    const user = await queryOne<UserRow>(
      `SELECT user_id, name, email, role, created_at
       FROM users
       WHERE reset_token = ?
         AND reset_expiry IS NOT NULL
         AND reset_expiry > NOW()`,
      [token.trim()]
    );

    if (!user) {
      res.status(400).json({ message: "This reset link is invalid or has expired." });
      return;
    }

    const passwordHash = await bcrypt.hash(password!, BCRYPT_ROUNDS);
    await execute(
      `UPDATE users
       SET password_hash = ?, reset_token = NULL, reset_expiry = NULL
       WHERE user_id = ?`,
      [passwordHash, user.user_id]
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
