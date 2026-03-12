import { useState, useEffect, useRef, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../i18n";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function SignupPage() {
  const { t } = useLanguage();
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
        text: "signup_with",
      });
    }
  }, [googleLogin, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t.passwordMinLength);
      return;
    }

    setLoading(true);
    const err = await signup(name.trim(), email, password);
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
          {t.signupTitle}
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
            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t.name}
            </label>
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
              {t.email}
            </label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
              {t.password}
            </label>
            <input
              id="signup-password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : t.signup}
          </button>
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
          {t.haveAccount}{" "}
          <Link to="/login" className="text-india-blue hover:underline font-medium">
            {t.login}
          </Link>
        </p>
      </div>
    </main>
  );
}
