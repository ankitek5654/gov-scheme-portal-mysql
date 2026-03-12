import { Scheme, Category, EligibilityProfile, EligibilityResponse } from "../types/scheme";

const BASE = "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function getSchemes(search?: string, category?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  return fetchJSON<Scheme[]>(`${BASE}/schemes?${params}`);
}

export function getScheme(id: number) {
  return fetchJSON<Scheme>(`${BASE}/schemes/${id}`);
}

export function getRelatedSchemes(id: number) {
  return fetchJSON<Scheme[]>(`${BASE}/schemes/${id}/related`);
}

export function getNewSchemes() {
  return fetchJSON<Scheme[]>(`${BASE}/schemes/new`);
}

export function getCategories() {
  return fetchJSON<Category[]>(`${BASE}/categories`);
}

export function checkEligibility(profile: EligibilityProfile) {
  return fetchJSON<EligibilityResponse>(`${BASE}/eligibility/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

export interface SchemeEligibilityResult {
  eligible: boolean;
  confidence?: "high" | "medium" | "low";
  reasons: string[];
}

export function checkSchemeEligibility(schemeId: number, profile: EligibilityProfile) {
  return fetchJSON<SchemeEligibilityResult>(`${BASE}/eligibility/check/${schemeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function getMyApplications(token: string) {
  return fetchJSON<ApplicationRow[]>(`${BASE}/applications`, {
    headers: authHeaders(token),
  });
}

export function getApplicationStatus(token: string, schemeId: number) {
  return fetchJSON<{ applied: boolean; id?: number; status?: string; applied_at?: string }>(
    `${BASE}/applications/${schemeId}/status`,
    { headers: authHeaders(token) }
  );
}

export function applyForScheme(token: string, schemeId: number) {
  return fetchJSON<{ id: number; scheme_id: number; status: string; applied_at: string }>(
    `${BASE}/applications/${schemeId}/apply`,
    { method: "POST", headers: authHeaders(token) }
  );
}

export function withdrawApplication(token: string, applicationId: number) {
  return fetchJSON<{ success: boolean }>(`${BASE}/applications/${applicationId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export interface ApplicationRow {
  id: number;
  scheme_id: number;
  status: string;
  applied_at: string;
  name: string;
  name_hi: string;
  ministry: string;
  ministry_hi: string;
  category: string;
  benefit_amount: string;
  benefit_type: string;
  description: string;
  description_hi: string;
  application_process: string;
  official_link: string;
}

// ─── Admin APIs ───

export interface AdminStats {
  schemes: number;
  users: number;
  applications: number;
  pending: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AdminApplication {
  id: number;
  user_id: number;
  scheme_id: number;
  status: string;
  applied_at: string;
  user_name: string;
  user_email: string;
  scheme_name: string;
  category: string;
}

export function adminGetStats(token: string) {
  return fetchJSON<AdminStats>(`${BASE}/admin/stats`, { headers: authHeaders(token) });
}

export function adminGetSchemes(token: string) {
  return fetchJSON<Scheme[]>(`${BASE}/admin/schemes`, { headers: authHeaders(token) });
}

export function adminAddScheme(token: string, data: Record<string, unknown>) {
  return fetchJSON<{ id: number }>(`${BASE}/admin/schemes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function adminUpdateScheme(token: string, id: number, data: Record<string, unknown>) {
  return fetchJSON<{ success: boolean }>(`${BASE}/admin/schemes/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function adminDeleteScheme(token: string, id: number) {
  return fetchJSON<{ success: boolean }>(`${BASE}/admin/schemes/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function adminGetUsers(token: string) {
  return fetchJSON<AdminUser[]>(`${BASE}/admin/users`, { headers: authHeaders(token) });
}

export function adminAddAdmin(token: string, name: string, email: string, password: string) {
  return fetchJSON<{ id: number; name: string; email: string; role: string }>(
    `${BASE}/admin/users`,
    { method: "POST", headers: authHeaders(token), body: JSON.stringify({ name, email, password }) }
  );
}

export function adminChangeRole(token: string, userId: number, role: string) {
  return fetchJSON<{ success: boolean }>(`${BASE}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
}

export function adminDeleteUser(token: string, userId: number) {
  return fetchJSON<{ success: boolean }>(`${BASE}/admin/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function adminGetApplications(token: string) {
  return fetchJSON<AdminApplication[]>(`${BASE}/admin/applications`, { headers: authHeaders(token) });
}

export function adminUpdateAppStatus(token: string, appId: number, status: string) {
  return fetchJSON<{ success: boolean }>(`${BASE}/admin/applications/${appId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export function adminDeleteApplication(token: string, appId: number) {
  return fetchJSON<{ success: boolean }>(`${BASE}/admin/applications/${appId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
