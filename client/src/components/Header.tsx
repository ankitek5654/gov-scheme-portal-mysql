import { Link } from "react-router-dom";
import { useLanguage } from "../i18n";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { t, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="bg-india-blue text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-saffron-500 rounded-full flex items-center justify-center text-xl font-bold">
            🏛
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{t.appTitle}</h1>
            <p className="text-xs text-gray-300">{t.appSubtitle}</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-saffron-500 transition-colors hidden sm:inline">
            {t.home}
          </Link>
          <Link to="/eligibility" className="hover:text-saffron-500 transition-colors hidden sm:inline">
            {t.eligibilityChecker}
          </Link>
          <Link to="/whats-new" className="hover:text-saffron-500 transition-colors hidden sm:inline">
            {t.whatsNew}
          </Link>
          {user && user.role !== "admin" && (
            <Link to="/my-applications" className="hover:text-saffron-500 transition-colors hidden sm:inline">
              {t.myApplications}
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="hover:text-saffron-500 transition-colors hidden sm:inline font-semibold">
              {t.adminPanel}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <span className="hidden sm:inline text-saffron-300 text-xs">
                {t.welcomeBack}, {user.name}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 border border-white/30 hover:bg-white/10 rounded text-sm transition-colors"
              >
                {t.logout}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-3 py-1 border border-white/30 hover:bg-white/10 rounded text-sm transition-colors"
            >
              {t.login}
            </Link>
          )}

          <button
            onClick={toggleLanguage}
            className="px-3 py-1 bg-saffron-500 hover:bg-saffron-600 rounded text-sm font-semibold transition-colors"
            aria-label="Toggle language"
          >
            {t.language}
          </button>
        </nav>
      </div>

      {/* Mobile nav */}
      <nav className="sm:hidden flex justify-center gap-4 pb-2 text-xs">
        <Link to="/" className="hover:text-saffron-500">{t.home}</Link>
        <Link to="/eligibility" className="hover:text-saffron-500">{t.eligibilityChecker}</Link>
        <Link to="/whats-new" className="hover:text-saffron-500">{t.whatsNew}</Link>
        {user && user.role !== "admin" && (
          <Link to="/my-applications" className="hover:text-saffron-500">{t.myApplications}</Link>
        )}
        {user?.role === "admin" && (
          <Link to="/admin" className="hover:text-saffron-500 font-semibold">{t.adminPanel}</Link>
        )}
        {user ? (
          <button onClick={logout} className="hover:text-saffron-500">{t.logout}</button>
        ) : (
          <Link to="/login" className="hover:text-saffron-500">{t.login}</Link>
        )}
      </nav>
    </header>
  );
}
