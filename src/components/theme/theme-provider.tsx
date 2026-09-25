"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const subscribers = new Set<() => void>();

function getTheme(): Theme {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

function subscribeToTheme(subscriber: () => void) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem("matefor-theme", theme);
  } catch {
    // Theme changes still work when browser storage is disabled.
  }
  document.cookie = `matefor-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  subscribers.forEach((subscriber) => subscriber());
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, getTheme, () => "light");
  const toggleTheme = useCallback(() => {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  }, []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
