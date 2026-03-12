import { useLanguage } from "../i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-800 text-gray-300 text-center py-6 mt-12">
      <p className="text-sm max-w-2xl mx-auto px-4">{t.footer}</p>
      <p className="text-xs mt-2 text-gray-500">© 2026 Gov Scheme Portal — India</p>
    </footer>
  );
}
