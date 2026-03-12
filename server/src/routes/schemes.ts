import { Router } from "express";
import { Database } from "sql.js";
import {
  getAllSchemes,
  getSchemeById,
  getNewSchemes,
  getRelatedSchemes,
} from "../models/scheme";
import { validateSearch, handleValidationErrors } from "../utils/validation";

export function createSchemesRouter(db: Database) {
  const router = Router();

  router.get("/", validateSearch, handleValidationErrors, (req, res) => {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const schemes = getAllSchemes(db, search, category);
    res.json(schemes);
  });

  router.get("/new", (_req, res) => {
    const schemes = getNewSchemes(db);
    res.json(schemes);
  });

  router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid scheme ID" });
      return;
    }
    const scheme = getSchemeById(db, id);
    if (!scheme) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    res.json(scheme);
  });

  router.get("/:id/related", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid scheme ID" });
      return;
    }
    const scheme = getSchemeById(db, id);
    if (!scheme) {
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    const related = getRelatedSchemes(db, id, scheme.category);
    res.json(related);
  });

  return router;
}
