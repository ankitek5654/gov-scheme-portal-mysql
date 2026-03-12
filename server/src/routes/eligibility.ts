import { Router } from "express";
import { Database } from "sql.js";
import { checkEligibility, checkSchemeEligibility } from "../models/scheme";
import {
  validateEligibility,
  handleValidationErrors,
} from "../utils/validation";
import { param } from "express-validator";

export function createEligibilityRouter(db: Database) {
  const router = Router();

  router.post("/check", validateEligibility, handleValidationErrors, (req, res) => {
    const results = checkEligibility(db, req.body);
    res.json({
      results,
      disclaimer:
        "This eligibility check is for informational purposes only and is not legally binding. Please verify with the official scheme portal or nearest government office.",
    });
  });

  router.post(
    "/check/:schemeId",
    [param("schemeId").isInt({ min: 1 }), ...validateEligibility],
    handleValidationErrors,
    (req, res) => {
      const schemeId = Number(req.params.schemeId);
      const result = checkSchemeEligibility(db, schemeId, req.body);
      res.json(result);
    }
  );

  return router;
}
