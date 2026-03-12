import { useNewSchemes } from "../hooks/useSchemes";
import { useLanguage } from "../i18n";
import SchemeCard from "../components/SchemeCard";

export default function WhatsNewPage() {
  const { t } = useLanguage();
  const { schemes, loading } = useNewSchemes();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-india-blue mb-2">
        {t.recentlyUpdated}
      </h1>
      <p className="text-gray-600 text-sm mb-8">
        {t.whatsNew}
      </p>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-india-blue rounded-full animate-spin" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : schemes.length === 0 ? (
        <p className="text-gray-500">{t.noSchemesFound}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schemes.map((s) => (
            <SchemeCard key={s.id} scheme={s} />
          ))}
        </div>
      )}
    </main>
  );
}
