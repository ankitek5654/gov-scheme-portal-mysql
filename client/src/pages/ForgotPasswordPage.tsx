import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLink("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.noAccountFound);
      } else {
        setResetLink("sent");
      }
    } catch {
      setError(t.noAccountFound);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-india-blue focus:border-transparent text-sm";

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-india-blue mb-2 text-center">
          {t.forgotPasswordTitle}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {t.forgotPasswordDesc}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {resetLink ? (
          <div>
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6 text-sm">
              <p className="font-semibold mb-2">{t.resetLinkSent}</p>
              <p className="text-gray-600 text-sm">{t.checkEmailForReset}</p>
            </div>
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-india-blue hover:underline font-medium">
                {t.backToLogin}
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                {t.email}
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : t.sendResetLink}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-india-blue hover:underline font-medium">
                {t.backToLogin}
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
