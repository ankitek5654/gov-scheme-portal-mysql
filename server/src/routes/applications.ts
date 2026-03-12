import { Router } from "express";
import { Database } from "sql.js";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { saveDb } from "../db";
import { sendApplicationConfirmation } from "../utils/mailer";

export function createApplicationsRouter(db: Database) {
  const router = Router();

  // Apply for a scheme
  router.post("/:schemeId/apply", requireAuth, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const schemeId = Number(req.params.schemeId);

    if (!Number.isInteger(schemeId) || schemeId < 1) {
      res.status(400).json({ error: "Invalid scheme ID" });
      return;
    }

    // Check scheme exists
    const schemeStmt = db.prepare("SELECT id, name FROM schemes WHERE id = ?");
    schemeStmt.bind([schemeId]);
    if (!schemeStmt.step()) {
      schemeStmt.free();
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    const schemeName = schemeStmt.get()[1] as string;
    schemeStmt.free();

    // Check if already applied
    const dupStmt = db.prepare(
      "SELECT id FROM applications WHERE user_id = ? AND scheme_id = ?"
    );
    dupStmt.bind([userId, schemeId]);
    if (dupStmt.step()) {
      dupStmt.free();
      res.status(409).json({ error: "You have already applied for this scheme" });
      return;
    }
    dupStmt.free();

    db.run(
      "INSERT INTO applications (user_id, scheme_id, status) VALUES (?, ?, ?)",
      [userId, schemeId, "pending"]
    );
    saveDb();

    // Get inserted application
    const idStmt = db.prepare("SELECT last_insert_rowid() as id");
    idStmt.step();
    const appId = (idStmt.get() as unknown[])[0] as number;
    idStmt.free();

    // Get user info for email
    const userStmt = db.prepare("SELECT name, email FROM users WHERE id = ?");
    userStmt.bind([userId]);
    userStmt.step();
    const userRow = userStmt.get();
    const userName = userRow[0] as string;
    const userEmail = userRow[1] as string;
    userStmt.free();

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
  router.get("/", requireAuth, (req: AuthRequest, res) => {
    const userId = req.userId!;

    const stmt = db.prepare(`
      SELECT 
        a.id, a.scheme_id, a.status, a.applied_at,
        s.name, s.name_hi, s.ministry, s.ministry_hi, s.category,
        s.benefit_amount, s.benefit_type, s.description, s.description_hi,
        s.application_process, s.official_link
      FROM applications a
      JOIN schemes s ON a.scheme_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.applied_at DESC
    `);
    stmt.bind([userId]);

    const cols = stmt.getColumnNames();
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      const vals = stmt.get();
      const row: Record<string, unknown> = {};
      cols.forEach((c, i) => { row[c] = vals[i]; });
      rows.push(row);
    }
    stmt.free();

    res.json(rows);
  });

  // Check if user has applied for a specific scheme
  router.get("/:schemeId/status", requireAuth, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const schemeId = Number(req.params.schemeId);

    const stmt = db.prepare(
      "SELECT id, status, applied_at FROM applications WHERE user_id = ? AND scheme_id = ?"
    );
    stmt.bind([userId, schemeId]);

    if (!stmt.step()) {
      stmt.free();
      res.json({ applied: false });
      return;
    }

    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const row: Record<string, unknown> = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
    stmt.free();

    res.json({ applied: true, ...row });
  });

  // Withdraw an application
  router.delete("/:id", requireAuth, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const appId = Number(req.params.id);

    if (!Number.isInteger(appId) || appId < 1) {
      res.status(400).json({ error: "Invalid application ID" });
      return;
    }

    // Verify ownership
    const checkStmt = db.prepare(
      "SELECT id FROM applications WHERE id = ? AND user_id = ?"
    );
    checkStmt.bind([appId, userId]);
    if (!checkStmt.step()) {
      checkStmt.free();
      res.status(404).json({ error: "Application not found" });
      return;
    }
    checkStmt.free();

    db.run("DELETE FROM applications WHERE id = ?", [appId]);
    saveDb();

    res.json({ success: true });
  });

  return router;
}
