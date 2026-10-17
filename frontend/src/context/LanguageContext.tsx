"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import en from "../i18n/en.json";
import hi from "../i18n/hi.json";
import kn from "../i18n/kn.json";
import ta from "../i18n/ta.json";

export type Language = "en" | "hi" | "kn" | "ta";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof en) => string;
  speak: (text: string) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
}

const translations: Record<Language, Record<string, string>> = {
  en,
  hi,
  kn,
  ta,
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => en[key] || String(key),
  speak: () => {},
  isSpeaking: false,
  stopSpeaking: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("qr_health_lang") as Language;
    if (saved && ["en", "hi", "kn", "ta"].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("qr_health_lang", lang);
  };

  const t = (key: keyof typeof en): string => {
    return translations[language]?.[key] || en[key] || String(key);
  };

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text to speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select appropriate language voice
    const langVoiceMap: Record<Language, string> = {
      en: "en-IN",
      hi: "hi-IN",
      kn: "kn-IN",
      ta: "ta-IN",
    };
    utterance.lang = langVoiceMap[language] || "en-US";
    utterance.rate = 0.9; // Slightly slower for elderly comprehension

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, speak, isSpeaking, stopSpeaking }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
