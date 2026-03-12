import { body, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateSearch = [
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .escape(),
  query("category")
    .optional()
    .isString()
    .trim()
    .isAlphanumeric("en-US", { ignore: "_" })
    .isLength({ max: 50 }),
];

export const validateEligibility = [
  body("age").isInt({ min: 0, max: 150 }),
  body("gender").isIn(["male", "female", "other"]),
  body("annualIncome").isInt({ min: 0 }),
  body("state").isString().trim().isLength({ min: 1, max: 100 }),
  body("occupation").isString().trim().isLength({ min: 1, max: 100 }),
  body("category").isIn(["general", "obc", "sc", "st", "ews"]),
  body("hasDisability").isBoolean(),
];

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
}
