import { Router } from "express";
import { Pool } from "mysql2/promise";
import { checkEligibility, checkSchemeEligibility } from "../models/scheme";
import {
  validateEligibility,
  handleValidationErrors,
} from "../utils/validation";
import { param } from "express-validator";

export function createEligibilityRouter(pool: Pool) {
  const router = Router();

  router.post("/check", validateEligibility, handleValidationErrors, async (req, res) => {
    const results = await checkEligibility(pool, req.body);
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
    async (req, res) => {
      const schemeId = Number(req.params.schemeId);
      const result = await checkSchemeEligibility(pool, schemeId, req.body);
      res.json(result);
    }
  );

  return router;
}
