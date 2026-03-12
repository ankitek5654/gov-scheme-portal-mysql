import { Scheme } from "../types/scheme";
import { useLanguage } from "../i18n";
import SchemeCard from "./SchemeCard";

interface SchemeListProps {
  schemes: Scheme[];
  loading: boolean;
}

export default function SchemeList({ schemes, loading }: SchemeListProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-india-blue rounded-full animate-spin" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (schemes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" aria-live="polite">
        <p>{t.noSchemesFound}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4" aria-live="polite">
        {schemes.length} {t.schemesFound}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schemes.map((scheme) => (
          <SchemeCard key={scheme.id} scheme={scheme} />
        ))}
      </div>
    </div>
  );
}
