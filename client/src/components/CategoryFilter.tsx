import { Category } from "../types/scheme";
import { useLanguage } from "../i18n";

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter by category">
      <button
        role="radio"
        aria-checked={selected === ""}
        onClick={() => onSelect("")}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === ""
            ? "bg-india-blue text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {t.allCategories}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="radio"
          aria-checked={selected === cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === cat.id
              ? "bg-india-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {lang === "hi" ? cat.label_hi : cat.label}
        </button>
      ))}
    </div>
  );
}
