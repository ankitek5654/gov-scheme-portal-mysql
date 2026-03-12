import { useState } from "react";
import { useLanguage } from "../i18n";
import { EligibilityProfile, EligibilityResult } from "../types/scheme";
import { checkEligibility } from "../utils/api";
import EligibilityForm from "../components/EligibilityForm";
import { Link } from "react-router-dom";

export default function EligibilityCheckerPage() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EligibilityResult[] | null>(null);
  const [disclaimer, setDisclaimer] = useState("");

  const handleSubmit = async (profile: EligibilityProfile) => {
    setLoading(true);
    try {
      const data = await checkEligibility(profile);
      setResults(data.results);
      setDisclaimer(data.disclaimer);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const confidenceColors = {
    high: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-gray-100 text-gray-600 border-gray-300",
  };

  const confidenceLabels = {
    high: t.highConfidence,
    medium: t.mediumConfidence,
    low: t.lowConfidence,
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-india-blue mb-2">
        {t.eligibilityChecker}
      </h1>
      <p className="text-gray-600 text-sm mb-8">
        {t.appSubtitle}
      </p>

      <EligibilityForm onSubmit={handleSubmit} loading={loading} />

      {results !== null && (
        <section className="mt-10" aria-live="polite">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.resultsTitle}</h2>

          {disclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
              <strong>{t.disclaimer}:</strong> {disclaimer}
            </div>
          )}

          {results.length === 0 ? (
            <p className="text-gray-500">{t.noResults}</p>
          ) : (
            <div className="space-y-4">
              {results.map((r) => (
                <div
                  key={r.scheme.id}
                  className={`rounded-lg border p-5 ${confidenceColors[r.confidence]}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link
                      to={`/scheme/${r.scheme.id}`}
                      className="text-base font-semibold hover:underline"
                    >
                      {lang === "hi" ? r.scheme.name_hi : r.scheme.name}
                    </Link>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/60 shrink-0">
                      {confidenceLabels[r.confidence]}
                    </span>
                  </div>
                  <p className="text-sm opacity-80 mb-2">
                    {lang === "hi" ? r.scheme.description_hi : r.scheme.description}
                  </p>
                  <p className="text-xs font-medium">
                    {t.benefitAmount}: {r.scheme.benefit_amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
