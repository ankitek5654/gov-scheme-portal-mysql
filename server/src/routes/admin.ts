import { Router } from "express";
import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { body, param } from "express-validator";
import { requireAuth, requireAdmin, AuthRequest } from "../middleware/auth";
import { handleValidationErrors } from "../utils/validation";
import bcrypt from "bcryptjs";
import { sendApplicationRejection } from "../utils/mailer";

export function createAdminRouter(pool: Pool) {
  const router = Router();
  router.use(requireAuth, requireAdmin);

  // ─── Dashboard Stats ───
  router.get("/stats", async (_req, res) => {
    const [[s]] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as c FROM schemes");
    const [[u]] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as c FROM users");
    const [[a]] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as c FROM applications");
    const [[p]] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as c FROM applications WHERE status = 'pending'");
    res.json({ schemes: s.c, users: u.c, applications: a.c, pending: p.c });
  });

  // ─── Schemes CRUD ───
  router.get("/schemes", async (_req, res) => {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM schemes ORDER BY id DESC");
    res.json(rows);
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

  router.post("/schemes", validateScheme, handleValidationErrors, async (req: AuthRequest, res) => {
    const b = req.body;
    const [result] = await pool.execute<ResultSetHeader>(
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
    res.status(201).json({ id: result.insertId });
  });

  router.put("/schemes/:id", validateScheme, handleValidationErrors, async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const b = req.body;
    const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM schemes WHERE id = ?", [id]);
    if (!existing.length) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    await pool.execute(
      `UPDATE schemes SET
        name=?, name_hi=?, ministry=?, ministry_hi=?, category=?,
        description=?, description_hi=?, eligibility_criteria=?, required_documents=?,
        application_process=?, benefit_amount=?, benefit_type=?, deadline=?,
        official_link=?, tags=?, is_new=?, min_age=?, max_age=?, max_income=?,
        gender_restriction=?, category_restriction=?, disability_required=?,
        updated_at=NOW()
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
    res.json({ success: true });
  });

  router.delete("/schemes/:id", async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await pool.execute("DELETE FROM applications WHERE scheme_id = ?", [id]);
    await pool.execute("DELETE FROM schemes WHERE id = ?", [id]);
    res.json({ success: true });
  });

  // ─── Users Management ───
  router.get("/users", async (_req, res) => {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC");
    res.json(rows);
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

      const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      try {
        const passwordHash = await bcrypt.hash(password, 12);
        const [result] = await pool.execute<ResultSetHeader>(
          "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
          [name, email, passwordHash, "admin"]
        );
        res.status(201).json({ id: result.insertId, name, email, role: "admin" });
      } catch (err) {
        res.status(500).json({ error: "Failed to create admin user" });
      }
    }
  );

  router.patch(
    "/users/:id/role",
    [param("id").isInt({ min: 1 }), body("role").isIn(["user", "admin"])],
    handleValidationErrors,
    async (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      if (id === req.userId) {
        res.status(400).json({ error: "Cannot change your own role" });
        return;
      }
      await pool.execute("UPDATE users SET role = ? WHERE id = ?", [req.body.role, id]);
      res.json({ success: true });
    }
  );

  router.delete("/users/:id", async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    if (id === req.userId) {
      res.status(400).json({ error: "Cannot delete yourself" });
      return;
    }
    await pool.execute("DELETE FROM applications WHERE user_id = ?", [id]);
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true });
  });

  // ─── Applications Management ───
  router.get("/applications", async (_req, res) => {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT a.id, a.user_id, a.scheme_id, a.status, a.applied_at,
             u.name as user_name, u.email as user_email,
             s.name as scheme_name, s.category
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN schemes s ON a.scheme_id = s.id
      ORDER BY a.applied_at DESC
    `);
    res.json(rows);
  });

  router.patch(
    "/applications/:id/status",
    [param("id").isInt({ min: 1 }), body("status").isIn(["pending", "under_review", "approved", "rejected"])],
    handleValidationErrors,
    async (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      const newStatus = req.body.status;
      await pool.execute("UPDATE applications SET status = ? WHERE id = ?", [newStatus, id]);

      if (newStatus === "rejected") {
        const [rows] = await pool.query<RowDataPacket[]>(
          `SELECT a.id, u.name, u.email, s.name as scheme_name
           FROM applications a
           JOIN users u ON a.user_id = u.id
           JOIN schemes s ON a.scheme_id = s.id
           WHERE a.id = ?`,
          [id]
        );
        if (rows.length) {
          const r = rows[0];
          sendApplicationRejection(r.email, r.name, r.scheme_name, r.id)
            .then(() => console.log(`[Mail] Rejection sent to ${r.email}`))
            .catch((err) => console.error(`[Mail] Failed rejection to ${r.email}:`, err.message));
        }
      }

      res.json({ success: true });
    }
  );

  router.delete("/applications/:id", async (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    await pool.execute("DELETE FROM applications WHERE id = ?", [id]);
    res.json({ success: true });
  });

  return router;
}
