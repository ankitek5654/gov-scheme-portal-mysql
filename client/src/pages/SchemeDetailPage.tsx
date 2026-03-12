import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useScheme } from "../hooks/useSchemes";
import { useLanguage } from "../i18n";
import { useAuth } from "../hooks/useAuth";
import { getApplicationStatus, applyForScheme, checkSchemeEligibility, SchemeEligibilityResult } from "../utils/api";
import { EligibilityProfile } from "../types/scheme";
import SchemeCard from "../components/SchemeCard";
import EligibilityForm from "../components/EligibilityForm";

export default function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { user, token } = useAuth();
  const { scheme, related, loading } = useScheme(Number(id));
  const [appStatus, setAppStatus] = useState<{ applied: boolean; status?: string; applied_at?: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const [eligStep, setEligStep] = useState<"form" | "result">("form");
  const [eligResult, setEligResult] = useState<SchemeEligibilityResult | null>(null);
  const [eligLoading, setEligLoading] = useState(false);

  // Check if user already applied for this scheme
  useEffect(() => {
    if (!token || !id) return;
    getApplicationStatus(token, Number(id))
      .then(setAppStatus)
      .catch(() => {});
  }, [token, id]);

  const handleEligibilityCheck = async (profile: EligibilityProfile) => {
    if (!scheme) return;
    setEligLoading(true);
    try {
      const result = await checkSchemeEligibility(scheme.id, profile);
      setEligResult(result);
      setEligStep("result");
    } catch {
      setEligResult({ eligible: false, reasons: ["Could not check eligibility. Please try again."] });
      setEligStep("result");
    } finally {
      setEligLoading(false);
    }
  };

  const handleApply = async () => {
    if (!token || !scheme) return;
    setApplying(true);
    try {
      await applyForScheme(token, scheme.id);
      setAppStatus({ applied: true, status: "pending", applied_at: new Date().toISOString() });
      // Open the official website in a new tab
      window.open(scheme.official_link, "_blank", "noopener,noreferrer");
    } catch {
      // ignore
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-india-blue rounded-full animate-spin" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Scheme not found.
      </div>
    );
  }

  const name = lang === "hi" ? scheme.name_hi : scheme.name;
  const ministry = lang === "hi" ? scheme.ministry_hi : scheme.ministry;
  const desc = lang === "hi" ? scheme.description_hi : scheme.description;
  const eligibility: string[] = JSON.parse(scheme.eligibility_criteria);
  const documents: string[] = JSON.parse(scheme.required_documents);
  const process: string[] = JSON.parse(scheme.application_process);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-india-blue hover:underline text-sm mb-4 inline-block">
        {t.backToSchemes}
      </Link>

      <article>
        <header className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <h1 className="text-2xl font-bold text-india-blue">{name}</h1>
            {scheme.is_new === 1 && (
              <span className="bg-india-green text-white text-xs px-2 py-1 rounded-full font-bold shrink-0 mt-1">
                {t.new}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{t.ministry}: {ministry}</p>
        </header>

        <p className="text-gray-700 leading-relaxed mb-8">{desc}</p>

        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          <InfoCard label={t.benefitAmount} value={scheme.benefit_amount} />
          <InfoCard label={t.benefitType} value={scheme.benefit_type} />
          <InfoCard
            label={t.deadline}
            value={scheme.deadline ? new Date(scheme.deadline).toLocaleDateString() : t.noDeadline}
          />
          <InfoCard
            label={t.officialLink}
            value={
              <a
                href={scheme.official_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-india-blue hover:underline break-all"
              >
                {scheme.official_link}
              </a>
            }
          />
        </div>

        <Section title={t.eligibilityCriteria}>
          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
            {eligibility.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title={t.requiredDocuments}>
          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
            {documents.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title={t.applicationProcess}>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
            {process.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Section>

        {/* Apply Now section */}
        <div className="bg-gradient-to-r from-india-blue/5 to-saffron-500/5 border border-india-blue/20 rounded-xl p-6 mb-6">
          {appStatus?.applied ? (
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <h3 className="text-lg font-semibold text-india-blue mb-1">{t.alreadyApplied}</h3>
              <p className="text-sm text-gray-500">
                {t.applicationStatus}:{" "}
                <span className="font-semibold capitalize">{appStatus.status}</span>
                {appStatus.applied_at && (
                  <> &middot; {t.appliedOn}: {new Date(appStatus.applied_at).toLocaleDateString()}</>
                )}
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <a
                  href={scheme.official_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 bg-india-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-900 transition-colors"
                >
                  {t.officialLink} ↗
                </a>
                <Link
                  to="/my-applications"
                  className="text-india-blue hover:underline text-sm"
                >
                  {t.myApplications} →
                </Link>
              </div>
            </div>
          ) : !user ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-india-blue mb-2">{t.applyNow}</h3>
              <p className="text-sm text-gray-500 mb-4">{t.loginToApply}</p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors"
              >
                {t.login}
              </Link>
            </div>
          ) : eligStep === "form" ? (
            <div>
              <h3 className="text-lg font-semibold text-india-blue mb-1 text-center">{t.applyNow}</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">{t.checkEligibilityFirst}</p>
              <EligibilityForm onSubmit={handleEligibilityCheck} loading={eligLoading} />
            </div>
          ) : eligResult?.eligible ? (
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">{t.youAreEligible}</h3>
              <ul className="text-sm text-gray-600 mb-4 space-y-1">
                {eligResult.reasons.map((r, i) => (
                  <li key={i} className="flex items-center justify-center gap-1">
                    <span className="text-green-500">✓</span> {r}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mb-4">{t.applyRedirectNote}</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-8 py-3 bg-india-green text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                >
                  {applying ? "..." : t.proceedToApply + " ↗"}
                </button>
                <button
                  onClick={() => { setEligStep("form"); setEligResult(null); }}
                  className="text-india-blue hover:underline text-sm"
                >
                  {t.checkAgain}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-2">❌</div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">{t.notEligible}</h3>
              <p className="text-sm text-gray-500 mb-3">{t.notEligibleReasons}</p>
              <ul className="text-sm text-red-600 mb-6 space-y-1">
                {eligResult?.reasons.map((r, i) => (
                  <li key={i} className="flex items-center justify-center gap-1">
                    <span>✗</span> {r}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setEligStep("form"); setEligResult(null); }}
                className="px-6 py-2 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors text-sm"
              >
                {t.checkAgain}
              </button>
            </div>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-india-blue mb-4">{t.relatedSchemes}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((s) => (
              <SchemeCard key={s.id} scheme={s} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
