import { useState } from "react";
import { useLanguage } from "../i18n";
import { useSchemes, useCategories } from "../hooks/useSchemes";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import SchemeList from "../components/SchemeList";
import { Link } from "react-router-dom";

export default function HomePage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categories = useCategories();
  const { schemes, loading } = useSchemes(search, category);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero banner */}
      <section className="bg-gradient-to-r from-india-blue to-blue-800 text-white rounded-xl p-8 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t.appTitle}</h2>
        <p className="text-gray-200 mb-6">{t.appSubtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/eligibility"
            className="inline-block bg-saffron-500 hover:bg-saffron-600 text-white font-semibold px-6 py-3 rounded-lg text-center transition-colors"
          >
            {t.checkEligibility}
          </Link>
          <Link
            to="/whats-new"
            className="inline-block bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg text-center transition-colors border border-white/30"
          >
            {t.whatsNew}
          </Link>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="mb-6 space-y-4">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
      </section>

      {/* Scheme listing */}
      <SchemeList schemes={schemes} loading={loading} />
    </main>
  );
}
