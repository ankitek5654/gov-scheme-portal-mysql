import { Router } from "express";
import { Database } from "sql.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { handleValidationErrors } from "../utils/validation";
import { saveDb } from "../db";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/mailer";

const JWT_SECRET = process.env.JWT_SECRET || "gov-scheme-portal-secret-key-change-in-production";
const TOKEN_EXPIRY = "7d";

// In-memory store for password reset tokens: token -> { email, expiresAt }
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

const validateSignup = [
  body("name").isString().trim().isLength({ min: 1, max: 100 }).escape(),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6, max: 128 }),
];

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 1, max: 128 }),
];

function rowToUser(columns: string[], values: unknown[]) {
  const obj: Record<string, unknown> = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj as { id: number; name: string; email: string; password_hash: string; role: string; created_at: string };
}

export function createAuthRouter(db: Database) {
  const router = Router();

  router.post("/signup", validateSignup, handleValidationErrors, async (req, res) => {
    const { name, email, password } = req.body;

    // Check if email already exists
    const checkStmt = db.prepare("SELECT id FROM users WHERE email = ?");
    checkStmt.bind([email]);
    if (checkStmt.step()) {
      checkStmt.free();
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    checkStmt.free();

    const passwordHash = await bcrypt.hash(password, 12);

    db.run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );
    saveDb();

    // Get the inserted user's ID
    const idStmt = db.prepare("SELECT last_insert_rowid() as id");
    idStmt.step();
    const userId = (idStmt.get() as unknown[])[0] as number;
    idStmt.free();

    const token = jwt.sign({ userId, email, role: "user" }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.status(201).json({
      token,
      user: { id: userId, name, email, role: "user" },
    });
  });

  router.post("/login", validateLogin, handleValidationErrors, async (req, res) => {
    const { email, password } = req.body;

    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    stmt.bind([email]);
    if (!stmt.step()) {
      stmt.free();
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const user = rowToUser(stmt.getColumnNames(), stmt.get());
    stmt.free();

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  router.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: number; email: string };

      const stmt = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?");
      stmt.bind([payload.userId]);
      if (!stmt.step()) {
        stmt.free();
        res.status(401).json({ error: "User not found" });
        return;
      }
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      stmt.free();

      const user: Record<string, unknown> = {};
      cols.forEach((c, i) => { user[c] = vals[i]; });

      res.json({ user });
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  });

  // Forgot Password — generate reset token
  router.post(
    "/forgot-password",
    [body("email").isEmail().normalizeEmail()],
    handleValidationErrors,
    (req, res) => {
      const { email } = req.body;

      const stmt = db.prepare("SELECT id FROM users WHERE email = ?");
      stmt.bind([email]);
      if (!stmt.step()) {
        stmt.free();
        res.status(404).json({ error: "No account found with this email" });
        return;
      }
      stmt.free();

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
      resetTokens.set(token, { email, expiresAt });

      // Build reset link using Referer/Origin header or fallback
      const origin = req.headers.origin || req.headers.referer?.replace(/\/+$/, "") || "http://localhost:5174";
      const resetLink = `${origin}/reset-password?token=${token}`;

      // Send email (non-blocking)
      sendPasswordResetEmail(email, resetLink)
        .then(() => console.log(`[Mail] Reset email sent to ${email}`))
        .catch((err) => console.error(`[Mail] Failed reset email to ${email}:`, err.message));

      res.json({ message: "Reset link sent to your email" });
    }
  );

  // Reset Password — verify token and update password
  router.post(
    "/reset-password",
    [
      body("token").isString().isLength({ min: 1 }),
      body("password").isString().isLength({ min: 6, max: 128 }),
    ],
    handleValidationErrors,
    async (req, res) => {
      const { token, password } = req.body;

      const entry = resetTokens.get(token);
      if (!entry || entry.expiresAt < Date.now()) {
        resetTokens.delete(token);
        res.status(400).json({ error: "Invalid or expired reset token" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      db.run("UPDATE users SET password_hash = ? WHERE email = ?", [passwordHash, entry.email]);
      saveDb();

      resetTokens.delete(token);
      res.json({ message: "Password reset successfully" });
    }
  );

  // Google Sign-In
  router.post("/google", async (req, res) => {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      res.status(400).json({ error: "Missing Google credential" });
      return;
    }

    try {
      // Verify the Google ID token via Google's tokeninfo endpoint
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );
      if (!verifyRes.ok) {
        res.status(401).json({ error: "Invalid Google token" });
        return;
      }
      const payload = await verifyRes.json() as { email?: string; name?: string; email_verified?: string };

      if (!payload.email || payload.email_verified !== "true") {
        res.status(401).json({ error: "Google email not verified" });
        return;
      }

      const email = payload.email;
      const name = payload.name || email.split("@")[0];

      // Check if user exists
      const stmt = db.prepare("SELECT id, name, email, role FROM users WHERE email = ?");
      stmt.bind([email]);
      if (stmt.step()) {
        // Existing user — log them in
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        stmt.free();
        const user: Record<string, unknown> = {};
        cols.forEach((c, i) => { user[c] = vals[i]; });
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: TOKEN_EXPIRY }
        );
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      } else {
        stmt.free();
        // New user — create account with random password hash
        const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
        db.run(
          "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
          [name, email, randomHash]
        );
        saveDb();
        const row = db.exec("SELECT id FROM users WHERE email = ?", [email]);
        const userId = row[0]?.values[0]?.[0] as number;
        const token = jwt.sign(
          { userId, email, role: "user" },
          JWT_SECRET,
          { expiresIn: TOKEN_EXPIRY }
        );
        res.status(201).json({ token, user: { id: userId, name, email, role: "user" } });
      }
    } catch {
      res.status(500).json({ error: "Google authentication failed" });
    }
  });

  return router;
}
