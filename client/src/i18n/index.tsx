import { createContext, useContext, useState, ReactNode } from "react";
import en from "./en";
import hi from "./hi";

type Translations = typeof en;
type Lang = "en" | "hi";

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: en,
  toggleLanguage: () => {},
});

const translations: Record<Lang, Translations> = { en, hi };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "hi" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
