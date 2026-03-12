import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../i18n";
import { getMyApplications, withdrawApplication, ApplicationRow } from "../utils/api";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function MyApplicationsPage() {
  const { t, lang } = useLanguage();
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getMyApplications(token)
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t.statusPending,
      under_review: t.statusUnderReview,
      approved: t.statusApproved,
      rejected: t.statusRejected,
    };
    return map[status] || status;
  };

  const handleWithdraw = async (appId: number) => {
    if (!token || !confirm(t.withdrawConfirm)) return;
    try {
      await withdrawApplication(token, appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch {
      // ignore
    }
  };

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-india-blue mb-4">{t.myApplications}</h1>
        <p className="text-gray-500 mb-6">{t.loginToApply}</p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
        >
          {t.login}
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-india-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-india-blue">{t.myApplications}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.totalApplications}: {applications.length}
          </p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 bg-india-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-900 transition-colors"
        >
          {t.browseSchemes}
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 mb-6">{t.noApplications}</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
          >
            {t.browseSchemes}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const schemeName = lang === "hi" ? app.name_hi : app.name;
            const ministry = lang === "hi" ? app.ministry_hi : app.ministry;

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/scheme/${app.scheme_id}`}
                      className="text-lg font-semibold text-india-blue hover:underline block truncate"
                    >
                      {schemeName}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">{ministry}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}
                    >
                      {statusLabel(app.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-4 text-gray-500">
                    <span>{t.appliedOn}: {new Date(app.applied_at).toLocaleDateString()}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{app.benefit_amount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/scheme/${app.scheme_id}`}
                      className="text-india-blue hover:underline text-sm"
                    >
                      {t.viewDetails}
                    </Link>
                    {app.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        className="text-red-600 hover:text-red-800 text-sm ml-2"
                      >
                        {t.withdrawApplication}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
