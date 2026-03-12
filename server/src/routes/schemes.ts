import { Router } from "express";
import { Pool } from "mysql2/promise";
import {
  getAllSchemes,
  getSchemeById,
  getNewSchemes,
  getRelatedSchemes,
} from "../models/scheme";
import { validateSearch, handleValidationErrors } from "../utils/validation";

export function createSchemesRouter(pool: Pool) {
  const router = Router();

  router.get("/", validateSearch, handleValidationErrors, async (req, res) => {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const schemes = await getAllSchemes(pool, search, category);
    res.json(schemes);
  });

  router.get("/new", async (_req, res) => {
    const schemes = await getNewSchemes(pool);
    res.json(schemes);
  });

  router.get("/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid scheme ID" });
      return;
    }
    const scheme = await getSchemeById(pool, id);
    if (!scheme) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    res.json(scheme);
  });

  router.get("/:id/related", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid scheme ID" });
      return;
    }
    const scheme = await getSchemeById(pool, id);
    if (!scheme) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    const related = await getRelatedSchemes(pool, id, scheme.category);
    res.json(related);
  });

  return router;
}
