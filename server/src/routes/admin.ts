import { Router } from "express";
import { Database } from "sql.js";
import { body, param } from "express-validator";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";
import { handleValidationErrors } from "../utils/validation";
import bcrypt from "bcryptjs";
import { saveDb } from "../db";
import { sendApplicationRejection } from "../utils/mailer";

export function createAdminRouter(db: Database) {
  const router = Router();
  router.use(requireAuth, requireAdmin);

  // ─── Dashboard Stats ───
  router.get("/stats", (_req, res) => {
    const schemeCount = (db.exec("SELECT COUNT(*) FROM schemes")[0]?.values[0]?.[0] ?? 0) as number;
    const userCount = (db.exec("SELECT COUNT(*) FROM users")[0]?.values[0]?.[0] ?? 0) as number;
    const appCount = (db.exec("SELECT COUNT(*) FROM applications")[0]?.values[0]?.[0] ?? 0) as number;
    const pendingCount = (db.exec("SELECT COUNT(*) FROM applications WHERE status = 'pending'")[0]?.values[0]?.[0] ?? 0) as number;
    res.json({ schemes: schemeCount, users: userCount, applications: appCount, pending: pendingCount });
  });

  // ─── Schemes CRUD ───
  router.get("/schemes", (_req, res) => {
    const rows = db.exec("SELECT * FROM schemes ORDER BY id DESC");
    if (!rows.length) { res.json([]); return; }
    const cols = rows[0].columns;
    const schemes = rows[0].values.map((vals) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((c, i) => { obj[c] = vals[i]; });
      return obj;
    });
    res.json(schemes);
  });

  const validateScheme = [
    body("name").isString().trim().isLength({ min: 1, max: 200 }),
    body("name_hi").isString().trim().isLength({ min: 1, max: 200 }),
    body("ministry").isString().trim().isLength({ min: 1, max: 200 }),
    body("ministry_hi").isString().trim().isLength({ min: 1, max: 200 }),
    body("category").isString().trim().isLength({ min: 1, max: 50 }),
    body("description").isString().trim().isLength({ min: 1 }),
    body("description_hi").isString().trim().isLength({ min: 1 }),
    body("eligibility_criteria").isString(),
    body("required_documents").isString(),
    body("application_process").isString(),
    body("benefit_amount").isString().trim(),
    body("benefit_type").isString().trim(),
    body("official_link").isString().trim(),
    body("tags").isString(),
  ];

  router.post("/schemes", validateScheme, handleValidationErrors, (req: AuthRequest, res) => {
    const b = req.body;
    db.run(
      `INSERT INTO schemes (
        name, name_hi, ministry, ministry_hi, category,
        description, description_hi, eligibility_criteria, required_documents,
        application_process, benefit_amount, benefit_type, deadline,
        official_link, tags, is_new, min_age, max_age, max_income,
        gender_restriction, category_restriction, disability_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.name, b.name_hi, b.ministry, b.ministry_hi, b.category,
        b.description, b.description_hi, b.eligibility_criteria, b.required_documents,
        b.application_process, b.benefit_amount, b.benefit_type, b.deadline || null,
        b.official_link, b.tags, b.is_new ? 1 : 0, b.min_age ?? null, b.max_age ?? null,
        b.max_income ?? null, b.gender_restriction || null, b.category_restriction || null,
        b.disability_required ? 1 : 0,
      ]
    );
    saveDb();
    const idRow = db.exec("SELECT last_insert_rowid() as id");
    const id = idRow[0].values[0][0];
    res.status(201).json({ id });
  });

  router.put("/schemes/:id", validateScheme, handleValidationErrors, (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const b = req.body;
    const check = db.exec(`SELECT id FROM schemes WHERE id = ${id}`);
    if (!check.length || !check[0].values.length) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    db.run(
      `UPDATE schemes SET
        name=?, name_hi=?, ministry=?, ministry_hi=?, category=?,
        description=?, description_hi=?, eligibility_criteria=?, required_documents=?,
        application_process=?, benefit_amount=?, benefit_type=?, deadline=?,
        official_link=?, tags=?, is_new=?, min_age=?, max_age=?, max_income=?,
        gender_restriction=?, category_restriction=?, disability_required=?,
        updated_at=datetime('now')
      WHERE id=?`,
      [
        b.name, b.name_hi, b.ministry, b.ministry_hi, b.category,
        b.description, b.description_hi, b.eligibility_criteria, b.required_documents,
        b.application_process, b.benefit_amount, b.benefit_type, b.deadline || null,
        b.official_link, b.tags, b.is_new ? 1 : 0, b.min_age ?? null, b.max_age ?? null,
        b.max_income ?? null, b.gender_restriction || null, b.category_restriction || null,
        b.disability_required ? 1 : 0, id,
      ]
    );
    saveDb();
    res.json({ success: true });
  });

  router.delete("/schemes/:id", (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    db.run("DELETE FROM applications WHERE scheme_id = ?", [id]);
    db.run("DELETE FROM schemes WHERE id = ?", [id]);
    saveDb();
    res.json({ success: true });
  });

  // ─── Users Management ───
  router.get("/users", (_req, res) => {
    const rows = db.exec("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC");
    if (!rows.length) { res.json([]); return; }
    const cols = rows[0].columns;
    const users = rows[0].values.map((vals) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((c, i) => { obj[c] = vals[i]; });
      return obj;
    });
    res.json(users);
  });

  // Create a new admin user
  router.post(
    "/users",
    [
      body("name").isString().trim().isLength({ min: 1, max: 100 }).escape(),
      body("email").isEmail().normalizeEmail(),
      body("password").isString().isLength({ min: 6, max: 128 }),
    ],
    handleValidationErrors,
    async (req: AuthRequest, res) => {
      const { name, email, password } = req.body;

      const checkStmt = db.prepare("SELECT id FROM users WHERE email = ?");
      checkStmt.bind([email]);
      if (checkStmt.step()) {
        checkStmt.free();
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }
      checkStmt.free();

      try {
        const passwordHash = await bcrypt.hash(password, 12);
        db.run(
          "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
          [name, email, passwordHash, "admin"]
        );
        saveDb();

        // Query back the created user to get the correct id
        const row = db.exec("SELECT id FROM users WHERE email = ?", [email]);
        const id = row[0]?.values[0]?.[0] ?? 0;
        res.status(201).json({ id, name, email, role: "admin" });
      } catch (err) {
        res.status(500).json({ error: "Failed to create admin user" });
      }
    }
  );

  router.patch(
    "/users/:id/role",
    [param("id").isInt({ min: 1 }), body("role").isIn(["user", "admin"])],
    handleValidationErrors,
    (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      if (id === req.userId) {
        res.status(400).json({ error: "Cannot change your own role" });
        return;
      }
      db.run("UPDATE users SET role = ? WHERE id = ?", [req.body.role, id]);
      saveDb();
      res.json({ success: true });
    }
  );

  router.delete("/users/:id", (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    if (id === req.userId) {
      res.status(400).json({ error: "Cannot delete yourself" });
      return;
    }
    db.run("DELETE FROM applications WHERE user_id = ?", [id]);
    db.run("DELETE FROM users WHERE id = ?", [id]);
    saveDb();
    res.json({ success: true });
  });

  // ─── Applications Management ───
  router.get("/applications", (_req, res) => {
    const rows = db.exec(`
      SELECT a.id, a.user_id, a.scheme_id, a.status, a.applied_at,
             u.name as user_name, u.email as user_email,
             s.name as scheme_name, s.category
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN schemes s ON a.scheme_id = s.id
      ORDER BY a.applied_at DESC
    `);
    if (!rows.length) { res.json([]); return; }
    const cols = rows[0].columns;
    const apps = rows[0].values.map((vals) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((c, i) => { obj[c] = vals[i]; });
      return obj;
    });
    res.json(apps);
  });

  router.patch(
    "/applications/:id/status",
    [param("id").isInt({ min: 1 }), body("status").isIn(["pending", "under_review", "approved", "rejected"])],
    handleValidationErrors,
    (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      const newStatus = req.body.status;
      db.run("UPDATE applications SET status = ? WHERE id = ?", [newStatus, id]);
      saveDb();

      if (newStatus === "rejected") {
        const rows = db.exec(
          `SELECT a.id, u.name, u.email, s.name as scheme_name
           FROM applications a
           JOIN users u ON a.user_id = u.id
           JOIN schemes s ON a.scheme_id = s.id
           WHERE a.id = ?`,
          [id]
        );
        if (rows.length && rows[0].values.length) {
          const [appId, userName, userEmail, schemeName] = rows[0].values[0] as [number, string, string, string];
          sendApplicationRejection(userEmail, userName, schemeName, appId)
            .then(() => console.log(`[Mail] Rejection sent to ${userEmail}`))
            .catch((err) => console.error(`[Mail] Failed rejection to ${userEmail}:`, err.message));
        }
      }

      res.json({ success: true });
    }
  );

  router.delete("/applications/:id", (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    db.run("DELETE FROM applications WHERE id = ?", [id]);
    saveDb();
    res.json({ success: true });
  });

  return router;
}
