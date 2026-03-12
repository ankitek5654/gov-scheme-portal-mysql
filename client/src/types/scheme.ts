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

export interface Category {
  id: string;
  label: string;
  label_hi: string;
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

export interface EligibilityResponse {
  results: EligibilityResult[];
  disclaimer: string;
}
