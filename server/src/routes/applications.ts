import { Router } from "express";
import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { sendApplicationConfirmation } from "../utils/mailer";

export function createApplicationsRouter(pool: Pool) {
  const router = Router();

  // Apply for a scheme
  router.post("/:schemeId/apply", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const schemeId = Number(req.params.schemeId);

    if (!Number.isInteger(schemeId) || schemeId < 1) {
      res.status(400).json({ error: "Invalid scheme ID" });
      return;
    }

    // Check scheme exists
    const [schemes] = await pool.query<RowDataPacket[]>("SELECT id, name FROM schemes WHERE id = ?", [schemeId]);
    if (!schemes.length) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    const schemeName = schemes[0].name as string;

    // Check if already applied
    const [dups] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM applications WHERE user_id = ? AND scheme_id = ?",
      [userId, schemeId]
    );
    if (dups.length) {
      res.status(409).json({ error: "You have already applied for this scheme" });
      return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO applications (user_id, scheme_id, status) VALUES (?, ?, ?)",
      [userId, schemeId, "pending"]
    );
    const appId = result.insertId;

    // Get user info for email
    const [users] = await pool.query<RowDataPacket[]>("SELECT name, email FROM users WHERE id = ?", [userId]);
    const userName = users[0].name as string;
    const userEmail = users[0].email as string;

    // Send confirmation email (non-blocking)
    sendApplicationConfirmation(userEmail, userName, schemeName, appId)
      .then(() => console.log(`[Mail] Confirmation sent to ${userEmail}`))
      .catch((err) => console.error(`[Mail] Failed to send to ${userEmail}:`, err.message));

    res.status(201).json({
      id: appId,
      scheme_id: schemeId,
      status: "pending",
      applied_at: new Date().toISOString(),
    });
  });

  // Get all applications for the current user
  router.get("/", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        a.id, a.scheme_id, a.status, a.applied_at,
        s.name, s.name_hi, s.ministry, s.ministry_hi, s.category,
        s.benefit_amount, s.benefit_type, s.description, s.description_hi,
        s.application_process, s.official_link
      FROM applications a
      JOIN schemes s ON a.scheme_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.applied_at DESC
    `, [userId]);

    res.json(rows);
  });

  // Check if user has applied for a specific scheme
  router.get("/:schemeId/status", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const schemeId = Number(req.params.schemeId);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, status, applied_at FROM applications WHERE user_id = ? AND scheme_id = ?",
      [userId, schemeId]
    );

    if (!rows.length) {
      res.json({ applied: false });
      return;
    }

    res.json({ applied: true, ...rows[0] });
  });

  // Withdraw an application
  router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const appId = Number(req.params.id);

    if (!Number.isInteger(appId) || appId < 1) {
      res.status(400).json({ error: "Invalid application ID" });
      return;
    }

    // Verify ownership
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM applications WHERE id = ? AND user_id = ?",
      [appId, userId]
    );
    if (!rows.length) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    await pool.execute("DELETE FROM applications WHERE id = ?", [appId]);

    res.json({ success: true });
  });

  return router;
}
