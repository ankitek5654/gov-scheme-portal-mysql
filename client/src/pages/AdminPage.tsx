import { useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../i18n";
import {
  adminGetStats,
  adminGetSchemes,
  adminAddScheme,
  adminUpdateScheme,
  adminDeleteScheme,
  adminGetUsers,
  adminAddAdmin,
  adminChangeRole,
  adminDeleteUser,
  adminGetApplications,
  adminUpdateAppStatus,
  adminDeleteApplication,
  AdminStats,
  AdminUser,
  AdminApplication,
} from "../utils/api";
import { Scheme } from "../types/scheme";

type Tab = "dashboard" | "schemes" | "users" | "applications";

export default function AdminPage() {
  const { t } = useLanguage();
  const { user, token } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (!user || user.role !== "admin") {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{t.accessDenied}</h1>
        <p className="text-gray-500 mb-2">{t.adminOnly}</p>
        <p className="text-xs text-gray-400 mb-6">{t.adminCredentials}</p>
        <Link
          to="/admin/login"
          className="inline-block px-6 py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
        >
          {t.adminLogin}
        </Link>
      </main>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: t.adminDashboard },
    { key: "schemes", label: t.adminSchemes },
    { key: "users", label: t.adminUsers },
    { key: "applications", label: t.adminApplications },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-india-blue mb-6">{t.adminPanel}</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? "border-india-blue text-india-blue"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab token={token!} />}
      {tab === "schemes" && <SchemesTab token={token!} />}
      {tab === "users" && <UsersTab token={token!} currentUserId={user.id} />}
      {tab === "applications" && <ApplicationsTab token={token!} />}
    </main>
  );
}

// ─── Dashboard ───
function DashboardTab({ token }: { token: string }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminGetStats(token).then(setStats).catch(() => {});
  }, [token]);

  if (!stats) return <Loading />;

  const cards = [
    { label: t.totalSchemes, value: stats.schemes, color: "bg-blue-50 text-blue-700" },
    { label: t.totalUsers, value: stats.users, color: "bg-green-50 text-green-700" },
    { label: t.totalApplications, value: stats.applications, color: "bg-purple-50 text-purple-700" },
    { label: t.pendingApplications, value: stats.pending, color: "bg-yellow-50 text-yellow-700" },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl p-6 ${c.color}`}>
          <p className="text-sm font-medium opacity-80">{c.label}</p>
          <p className="text-3xl font-bold mt-1">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Schemes Tab ───
function SchemesTab({ token }: { token: string }) {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetSchemes(token)
      .then(setSchemes)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm(t.deleteConfirm)) return;
    await adminDeleteScheme(token, id);
    setSchemes((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{schemes.length} {t.schemesFound}</p>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="px-4 py-2 bg-india-green text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          + {t.addScheme}
        </button>
      </div>

      {(showAdd || editingId !== null) && (
        <SchemeForm
          token={token}
          scheme={editingId !== null ? schemes.find((s) => s.id === editingId) : undefined}
          onClose={() => { setShowAdd(false); setEditingId(null); }}
          onSaved={load}
        />
      )}

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">{t.schemeName}</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">{t.ministry}</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">{t.socialCategory}</th>
              <th className="px-4 py-3 font-medium">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schemes.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{s.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{s.name}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell max-w-xs truncate">{s.ministry}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{s.category}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingId(s.id); setShowAdd(false); }}
                      className="text-india-blue hover:underline text-xs"
                    >
                      {t.editScheme}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      {t.deleteScheme}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Scheme Add/Edit Form ───
function SchemeForm({
  token,
  scheme,
  onClose,
  onSaved,
}: {
  token: string;
  scheme?: Scheme;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const isEdit = !!scheme;

  const [form, setForm] = useState({
    name: scheme?.name ?? "",
    name_hi: scheme?.name_hi ?? "",
    ministry: scheme?.ministry ?? "",
    ministry_hi: scheme?.ministry_hi ?? "",
    category: scheme?.category ?? "",
    description: scheme?.description ?? "",
    description_hi: scheme?.description_hi ?? "",
    eligibility_criteria: scheme?.eligibility_criteria ?? "[]",
    required_documents: scheme?.required_documents ?? "[]",
    application_process: scheme?.application_process ?? "[]",
    benefit_amount: scheme?.benefit_amount ?? "",
    benefit_type: scheme?.benefit_type ?? "",
    deadline: scheme?.deadline ?? "",
    official_link: scheme?.official_link ?? "",
    tags: scheme?.tags ?? "[]",
    is_new: scheme?.is_new ?? 0,
    min_age: scheme?.min_age ?? "",
    max_age: scheme?.max_age ?? "",
    max_income: scheme?.max_income ?? "",
    gender_restriction: scheme?.gender_restriction ?? "",
    category_restriction: scheme?.category_restriction ?? "",
    disability_required: scheme?.disability_required ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        is_new: form.is_new ? 1 : 0,
        min_age: form.min_age ? Number(form.min_age) : null,
        max_age: form.max_age ? Number(form.max_age) : null,
        max_income: form.max_income ? Number(form.max_income) : null,
        disability_required: form.disability_required ? 1 : 0,
      };
      if (isEdit) {
        await adminUpdateScheme(token, scheme!.id, payload);
      } else {
        await adminAddScheme(token, payload);
      }
      onSaved();
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-india-blue focus:border-transparent";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-india-blue">
          {isEdit ? t.editScheme : t.addScheme}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.schemeName} *</label>
            <input required className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.schemeNameHi} *</label>
            <input required className={inputClass} value={form.name_hi} onChange={(e) => set("name_hi", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.ministryName} *</label>
            <input required className={inputClass} value={form.ministry} onChange={(e) => set("ministry", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.ministryNameHi} *</label>
            <input required className={inputClass} value={form.ministry_hi} onChange={(e) => set("ministry_hi", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.socialCategory} *</label>
            <input required className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.benefitAmount} *</label>
            <input required className={inputClass} value={form.benefit_amount} onChange={(e) => set("benefit_amount", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.benefitType} *</label>
            <input required className={inputClass} value={form.benefit_type} onChange={(e) => set("benefit_type", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.officialLink} *</label>
            <input required className={inputClass} value={form.official_link} onChange={(e) => set("official_link", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t.deadline}</label>
            <input type="date" className={inputClass} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </div>
          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_new} onChange={(e) => set("is_new", e.target.checked ? 1 : 0)} />
              {t.isNew}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.descriptionEn} *</label>
          <textarea required rows={3} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.descriptionHi} *</label>
          <textarea required rows={3} className={inputClass} value={form.description_hi} onChange={(e) => set("description_hi", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.eligibilityCriteria} (JSON array) *</label>
          <textarea required rows={2} className={inputClass} value={form.eligibility_criteria} onChange={(e) => set("eligibility_criteria", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.requiredDocuments} (JSON array) *</label>
          <textarea required rows={2} className={inputClass} value={form.required_documents} onChange={(e) => set("required_documents", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.applicationProcess} (JSON array) *</label>
          <textarea required rows={2} className={inputClass} value={form.application_process} onChange={(e) => set("application_process", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.tags} (JSON array) *</label>
          <textarea required rows={1} className={inputClass} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Age</label>
            <input type="number" className={inputClass} value={form.min_age} onChange={(e) => set("min_age", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Age</label>
            <input type="number" className={inputClass} value={form.max_age} onChange={(e) => set("max_age", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Income</label>
            <input type="number" className={inputClass} value={form.max_income} onChange={(e) => set("max_income", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-india-blue text-white rounded-lg hover:bg-blue-900 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "..." : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Users Tab ───
function UsersTab({ token, currentUserId }: { token: string; currentUserId: number }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "" });
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetUsers(token)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const handleRoleChange = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await adminChangeRole(token, userId, newRole);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const handleDelete = async (userId: number) => {
    if (!confirm(t.deleteConfirm)) return;
    await adminDeleteUser(token, userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (addForm.password.length < 6) { setAddError(t.passwordMinLength); return; }
    setAdding(true);
    try {
      const result = await adminAddAdmin(token, addForm.name.trim(), addForm.email, addForm.password);
      setUsers((prev) => [{ ...result, created_at: new Date().toISOString() }, ...prev]);
      setShowAddAdmin(false);
      setAddForm({ name: "", email: "", password: "" });
    } catch {
      setAddError(t.emailExists);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loading />;

  // Filter out the current logged-in admin
  const visibleUsers = users.filter((u) => u.id !== currentUserId);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{visibleUsers.length} {t.totalUsers.toLowerCase()}</p>
        <button
          onClick={() => setShowAddAdmin(!showAddAdmin)}
          className="px-4 py-2 bg-india-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-900 transition-colors"
        >
          + {t.addAdmin}
        </button>
      </div>

      {showAddAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-bold text-india-blue mb-4">{t.addAdmin}</h3>
          {addError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{addError}</div>
          )}
          <form onSubmit={handleAddAdmin} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.name}</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-india-blue"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.email}</label>
              <input
                required
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-india-blue"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t.password}</label>
              <input
                required
                type="password"
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-india-blue"
                value={addForm.password}
                onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddAdmin(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 bg-india-blue text-white rounded-lg hover:bg-blue-900 text-sm font-semibold disabled:opacity-50"
              >
                {adding ? "..." : t.addAdmin}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">{t.name}</th>
              <th className="px-4 py-3 font-medium">{t.email}</th>
              <th className="px-4 py-3 font-medium">{t.role}</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">{t.created}</th>
              <th className="px-4 py-3 font-medium">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{u.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {u.role === "admin" ? t.admin : t.user}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRoleChange(u.id, u.role)}
                      className="text-india-blue hover:underline text-xs"
                    >
                      {u.role === "admin" ? `→ ${t.user}` : `→ ${t.admin}`}
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      {t.deleteUser}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Applications Tab ───
function ApplicationsTab({ token }: { token: string }) {
  const { t } = useLanguage();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    adminGetApplications(token)
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleStatus = async (appId: number, status: string) => {
    await adminUpdateAppStatus(token, appId, status);
    setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
  };

  const handleDelete = async (appId: number) => {
    if (!confirm(t.deleteConfirm)) return;
    await adminDeleteApplication(token, appId);
    setApps((prev) => prev.filter((a) => a.id !== appId));
  };

  if (loading) return <Loading />;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t.statusPending,
      under_review: t.statusUnderReview,
      approved: t.statusApproved,
      rejected: t.statusRejected,
    };
    return map[s] || s;
  };

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["all", "pending", "under_review", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
              filter === f ? "bg-india-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? `All (${apps.length})` : `${statusLabel(f)} (${apps.filter((a) => a.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">{t.user}</th>
              <th className="px-4 py-3 font-medium">{t.schemeName}</th>
              <th className="px-4 py-3 font-medium">{t.applicationStatus}</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">{t.appliedOn}</th>
              <th className="px-4 py-3 font-medium">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{a.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{a.user_name}</div>
                  <div className="text-xs text-gray-500">{a.user_email}</div>
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-gray-700">{a.scheme_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColors[a.status] || ""}`}>
                    {statusLabel(a.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {new Date(a.applied_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.status !== "approved" && (
                      <button onClick={() => handleStatus(a.id, "approved")} className="text-green-600 hover:underline text-xs">
                        {t.approve}
                      </button>
                    )}
                    {a.status !== "rejected" && (
                      <button onClick={() => handleStatus(a.id, "rejected")} className="text-red-600 hover:underline text-xs">
                        {t.reject}
                      </button>
                    )}
                    {a.status !== "under_review" && (
                      <button onClick={() => handleStatus(a.id, "under_review")} className="text-blue-600 hover:underline text-xs">
                        {t.markUnderReview}
                      </button>
                    )}
                    <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-600 hover:underline text-xs">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-india-blue rounded-full animate-spin" />
    </div>
  );
}
