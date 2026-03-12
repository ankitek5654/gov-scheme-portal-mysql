import { useState, FormEvent } from "react";
import { useLanguage } from "../i18n";
import { EligibilityProfile } from "../types/scheme";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

interface EligibilityFormProps {
  onSubmit: (profile: EligibilityProfile) => void;
  loading: boolean;
}

export default function EligibilityForm({ onSubmit, loading }: EligibilityFormProps) {
  const { t } = useLanguage();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [annualIncome, setAnnualIncome] = useState("");
  const [state, setState] = useState("");
  const [occupation, setOccupation] = useState("");
  const [category, setCategory] = useState("general");
  const [hasDisability, setHasDisability] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    const incomeNum = parseInt(annualIncome, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) return;
    if (isNaN(incomeNum) || incomeNum < 0) return;
    if (!state || !occupation) return;

    onSubmit({
      age: ageNum,
      gender,
      annualIncome: incomeNum,
      state: state.trim(),
      occupation: occupation.trim(),
      category,
      hasDisability,
    });
  };

  const fieldClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-india-blue text-sm";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="elig-age" className="block text-sm font-medium text-gray-700 mb-1">
            {t.age} *
          </label>
          <input
            id="elig-age"
            type="number"
            min={0}
            max={150}
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="elig-gender" className="block text-sm font-medium text-gray-700 mb-1">
            {t.gender} *
          </label>
          <select id="elig-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={fieldClass}>
            <option value="male">{t.male}</option>
            <option value="female">{t.female}</option>
            <option value="other">{t.other}</option>
          </select>
        </div>

        <div>
          <label htmlFor="elig-income" className="block text-sm font-medium text-gray-700 mb-1">
            {t.annualIncome} *
          </label>
          <input
            id="elig-income"
            type="number"
            min={0}
            required
            value={annualIncome}
            onChange={(e) => setAnnualIncome(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="elig-state" className="block text-sm font-medium text-gray-700 mb-1">
            {t.state} *
          </label>
          <select id="elig-state" value={state} onChange={(e) => setState(e.target.value)} className={fieldClass} required>
            <option value="">— Select —</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="elig-occupation" className="block text-sm font-medium text-gray-700 mb-1">
            {t.occupation} *
          </label>
          <input
            id="elig-occupation"
            type="text"
            required
            maxLength={100}
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="elig-category" className="block text-sm font-medium text-gray-700 mb-1">
            {t.socialCategory} *
          </label>
          <select id="elig-category" value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
            <option value="general">{t.general}</option>
            <option value="obc">{t.obc}</option>
            <option value="sc">{t.sc}</option>
            <option value="st">{t.st}</option>
            <option value="ews">{t.ews}</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasDisability}
              onChange={(e) => setHasDisability(e.target.checked)}
              className="w-4 h-4 text-india-blue rounded focus:ring-india-blue"
            />
            {t.hasDisability}
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full py-3 bg-india-blue text-white font-semibold rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
      >
        {loading ? "..." : t.submit}
      </button>
    </form>
  );
}
