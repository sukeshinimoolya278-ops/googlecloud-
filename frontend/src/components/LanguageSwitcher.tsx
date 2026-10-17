"use client";

import React from "react";
import { useLanguage, Language } from "../context/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; native: string }[] = [
    { code: "en", label: "English", native: "EN" },
    { code: "hi", label: "Hindi", native: "हिंदी" },
    { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
      <div className="pl-1.5 text-slate-500">
        <Globe size={14} />
      </div>
      {languages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? "bg-purple-700 text-white shadow-sm scale-105"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            {lang.native}
          </button>
        );
      })}
    </div>
  );
}
