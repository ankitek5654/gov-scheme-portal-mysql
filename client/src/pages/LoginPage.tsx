import { useState, useEffect, useRef, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../i18n";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: { theme?: string; size?: string; width?: number; text?: string }) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
  const { t } = useLanguage();
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setError("");
        setLoading(true);
        const err = await googleLogin(response.credential);
        setLoading(false);
        if (err) setError(err);
        else navigate("/");
      },
    });
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 400,
        text: "continue_with",
      });
    }
  }, [googleLogin, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate("/");
    }
  };

  const fieldClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-india-blue focus:border-transparent text-sm";

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-india-blue mb-2 text-center">
          {t.loginTitle}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {t.appSubtitle}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              {t.email}
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.password}
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : t.login}
          </button>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-india-blue hover:underline">
              {t.forgotPassword}
            </Link>
          </div>
        </form>

        {GOOGLE_CLIENT_ID && (
          <div className="mt-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-4 text-sm text-gray-400">{t.orContinueWith}</span>
            </div>
            <div ref={googleBtnRef} className="mt-4 flex justify-center" />
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          {t.noAccount}{" "}
          <Link to="/signup" className="text-india-blue hover:underline font-medium">
            {t.signup}
          </Link>
        </p>

        <p className="text-center text-sm text-gray-400 mt-3">
          <Link to="/admin/login" className="hover:underline">
            🔒 {t.adminLoginLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
