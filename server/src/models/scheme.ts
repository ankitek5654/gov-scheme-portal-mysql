import { Pool, RowDataPacket } from "mysql2/promise";

export interface Scheme {
  id: number;
  name: string;
  name_hi: string;
  ministry: string;
  ministry_hi: string;
  category: string;
  description: string;
  description_hi: string;
  eligibility_criteria: string;
  required_documents: string;
  application_process: string;
  benefit_amount: string;
  benefit_type: string;
  deadline: string | null;
  official_link: string;
  tags: string;
  is_new: number;
  min_age: number | null;
  max_age: number | null;
  max_income: number | null;
  gender_restriction: string | null;
  category_restriction: string | null;
  disability_required: number;
  created_at: string;
  updated_at: string;
}

export async function getAllSchemes(pool: Pool, search?: string, category?: string): Promise<Scheme[]> {
  let sql = "SELECT * FROM schemes WHERE 1=1";
  const params: unknown[] = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  if (search) {
    sql += " AND (name LIKE ? OR description LIKE ? OR tags LIKE ? OR ministry LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  sql += " ORDER BY is_new DESC, updated_at DESC";
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows as Scheme[];
}

export async function getSchemeById(pool: Pool, id: number): Promise<Scheme | undefined> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM schemes WHERE id = ?", [id]);
  return (rows as Scheme[])[0];
}

export async function getNewSchemes(pool: Pool): Promise<Scheme[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM schemes WHERE is_new = 1 ORDER BY updated_at DESC LIMIT 10");
  return rows as Scheme[];
}

export async function getRelatedSchemes(pool: Pool, id: number, category: string): Promise<Scheme[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM schemes WHERE category = ? AND id != ? LIMIT 4", [category, id]);
  return rows as Scheme[];
}

export interface EligibilityProfile {
  age: number;
  gender: string;
  annualIncome: number;
  state: string;
  occupation: string;
  category: string;
  hasDisability: boolean;
}

export interface EligibilityResult {
  scheme: Scheme;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

export async function checkEligibility(
  pool: Pool,
  profile: EligibilityProfile
): Promise<EligibilityResult[]> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM schemes");
  const allSchemes = rows as Scheme[];
  const results: EligibilityResult[] = [];

  for (const scheme of allSchemes) {
    let score = 0;
    const maxScore = 5;
    const reasons: string[] = [];

    // Age check
    if (scheme.min_age !== null && profile.age < scheme.min_age) continue;
    if (scheme.max_age !== null && profile.age > scheme.max_age) continue;
    score++;
    reasons.push("Age requirement met");

    // Income check
    if (scheme.max_income !== null) {
      if (profile.annualIncome > scheme.max_income) continue;
      score++;
      reasons.push("Income within limit");
    } else {
      score++;
      reasons.push("No income restriction");
    }

    // Gender check
    if (scheme.gender_restriction) {
      if (scheme.gender_restriction !== profile.gender) continue;
      score++;
      reasons.push("Gender requirement met");
    } else {
      score++;
      reasons.push("Open to all genders");
    }

    // Category check
    if (scheme.category_restriction) {
      const allowed = scheme.category_restriction.split(",");
      if (!allowed.includes(profile.category)) continue;
      score++;
      reasons.push("Social category requirement met");
    } else {
      score++;
      reasons.push("Open to all social categories");
    }

    // Disability check
    if (scheme.disability_required && !profile.hasDisability) continue;
    score++;

    const ratio = score / maxScore;
    let confidence: "high" | "medium" | "low";
    if (ratio >= 0.8) confidence = "high";
    else if (ratio >= 0.6) confidence = "medium";
    else confidence = "low";

    results.push({ scheme, confidence, reasons });
  }

  results.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });

  return results;
}

export async function checkSchemeEligibility(
  pool: Pool,
  schemeId: number,
  profile: EligibilityProfile
): Promise<{ eligible: boolean; confidence?: "high" | "medium" | "low"; reasons: string[] }> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM schemes WHERE id = ?", [schemeId]);
  const schemes = rows as Scheme[];
  if (!schemes.length) return { eligible: false, reasons: ["Scheme not found"] };
  const scheme = schemes[0];

  let score = 0;
  const maxScore = 5;
  const reasons: string[] = [];
  const failReasons: string[] = [];

  // Age check
  if (scheme.min_age !== null && profile.age < scheme.min_age) {
    failReasons.push(`Minimum age requirement is ${scheme.min_age}`);
  } else if (scheme.max_age !== null && profile.age > scheme.max_age) {
    failReasons.push(`Maximum age limit is ${scheme.max_age}`);
  } else {
    score++;
    reasons.push("Age requirement met");
  }

  // Income check
  if (scheme.max_income !== null) {
    if (profile.annualIncome > scheme.max_income) {
      failReasons.push(`Annual income must be below ₹${scheme.max_income.toLocaleString()}`);
    } else {
      score++;
      reasons.push("Income within limit");
    }
  } else {
    score++;
    reasons.push("No income restriction");
  }

  // Gender check
  if (scheme.gender_restriction) {
    if (scheme.gender_restriction !== profile.gender) {
      failReasons.push(`This scheme is only for ${scheme.gender_restriction} applicants`);
    } else {
      score++;
      reasons.push("Gender requirement met");
    }
  } else {
    score++;
    reasons.push("Open to all genders");
  }

  // Category check
  if (scheme.category_restriction) {
    const allowed = scheme.category_restriction.split(",");
    if (!allowed.includes(profile.category)) {
      failReasons.push(`This scheme is restricted to: ${allowed.join(", ").toUpperCase()}`);
    } else {
      score++;
      reasons.push("Social category requirement met");
    }
  } else {
    score++;
    reasons.push("Open to all social categories");
  }

  // Disability check
  if (scheme.disability_required && !profile.hasDisability) {
    failReasons.push("This scheme requires disability status");
  } else {
    score++;
  }

  if (failReasons.length > 0) {
    return { eligible: false, reasons: failReasons };
  }

  const ratio = score / maxScore;
  let confidence: "high" | "medium" | "low";
  if (ratio >= 0.8) confidence = "high";
  else if (ratio >= 0.6) confidence = "medium";
  else confidence = "low";

  return { eligible: true, confidence, reasons };
}
