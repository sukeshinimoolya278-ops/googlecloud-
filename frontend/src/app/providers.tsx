"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontScale: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  fontScale: 1,
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  resetFontSize: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontScale, setFontScale] = useState<number>(1);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // Read persisted theme or system preference
    const savedTheme = localStorage.getItem("vault_theme") as Theme | null;
    const initialTheme = savedTheme || "dark"; // default to the sleek dark biometric UI from image
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);

    // Read persisted font scale
    const savedScale = localStorage.getItem("vault_font_scale");
    if (savedScale) {
      const parsed = parseFloat(savedScale);
      if (!isNaN(parsed) && parsed >= 0.85 && parsed <= 1.4) {
        setFontScale(parsed);
        document.documentElement.style.setProperty("--font-scale", parsed.toString());
      }
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("vault_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const increaseFontSize = () => {
    const nextScale = Math.min(fontScale + 0.1, 1.35);
    setFontScale(nextScale);
    localStorage.setItem("vault_font_scale", nextScale.toString());
    document.documentElement.style.setProperty("--font-scale", nextScale.toString());
  };

  const decreaseFontSize = () => {
    const nextScale = Math.max(fontScale - 0.1, 0.85);
    setFontScale(nextScale);
    localStorage.setItem("vault_font_scale", nextScale.toString());
    document.documentElement.style.setProperty("--font-scale", nextScale.toString());
  };

  const resetFontSize = () => {
    setFontScale(1);
    localStorage.setItem("vault_font_scale", "1");
    document.documentElement.style.setProperty("--font-scale", "1");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        fontScale,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
      }}
    >
      <div style={{ opacity: mounted ? 1 : 0.98 }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
