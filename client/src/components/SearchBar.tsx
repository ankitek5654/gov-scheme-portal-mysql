import { useLanguage } from "../i18n";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <label htmlFor="scheme-search" className="sr-only">
        {t.searchPlaceholder}
      </label>
      <input
        id="scheme-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="w-full px-4 py-3 pl-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-india-blue focus:border-transparent text-sm"
        maxLength={200}
      />
      <svg
        className="absolute left-3 top-3.5 h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}
