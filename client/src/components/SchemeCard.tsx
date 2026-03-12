import { Link } from "react-router-dom";
import { Scheme } from "../types/scheme";
import { useLanguage } from "../i18n";

interface SchemeCardProps {
  scheme: Scheme;
}

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const { t, lang } = useLanguage();

  const name = lang === "hi" ? scheme.name_hi : scheme.name;
  const ministry = lang === "hi" ? scheme.ministry_hi : scheme.ministry;
  const desc = lang === "hi" ? scheme.description_hi : scheme.description;

  const isExpired = scheme.deadline && new Date(scheme.deadline) < new Date();

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-india-blue leading-snug">
          {name}
        </h3>
        <div className="flex gap-1 shrink-0">
          {scheme.is_new === 1 && (
            <span className="bg-india-green text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {t.new}
            </span>
          )}
          {isExpired && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {t.expired}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-2">{ministry}</p>
      <p className="text-sm text-gray-700 mb-3 line-clamp-3 flex-grow">{desc}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
        <span>
          {t.deadline}:{" "}
          <span className={isExpired ? "text-red-500" : "text-gray-700"}>
            {scheme.deadline ? new Date(scheme.deadline).toLocaleDateString() : t.noDeadline}
          </span>
        </span>
        <Link
          to={`/scheme/${scheme.id}`}
          className="text-saffron-500 hover:text-saffron-600 font-semibold"
        >
          {t.viewDetails} →
        </Link>
      </div>
    </article>
  );
}
