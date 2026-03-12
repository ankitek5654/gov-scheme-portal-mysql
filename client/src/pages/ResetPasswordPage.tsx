import { useState, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t.passwordMinLength);
      return;
    }
    if (password !== confirmPwd) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.invalidResetToken);
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t.invalidResetToken);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-india-blue focus:border-transparent text-sm";

  if (!token) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-600 mb-2">{t.invalidResetToken}</h1>
          <Link to="/forgot-password" className="text-india-blue hover:underline text-sm font-medium">
            {t.forgotPasswordTitle} →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-india-blue mb-2 text-center">
          {t.resetPasswordTitle}
        </h1>

        {success ? (
          <div className="text-center mt-6">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-green-700 font-semibold mb-4">{t.passwordResetSuccess}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
            >
              {t.login}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 mt-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.newPassword}
                </label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                />
                <p className="text-xs text-gray-400 mt-1">{t.passwordMinLength}</p>
              </div>

              <div>
                <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.confirmPassword}
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                {loading ? "..." : t.resetPassword}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-india-blue hover:underline font-medium">
                  {t.backToLogin}
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
