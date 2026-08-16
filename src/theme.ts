import { useCallback, useEffect, useState } from "react";

export type ColorTheme = "light" | "dark";

export const colorThemeStorageKey = "asset-tracker-color-theme";
const darkThemeQuery = "(prefers-color-scheme: dark)";

function storedColorTheme() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(colorThemeStorageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function resolveColorTheme(storedTheme: string | null, systemPrefersDark: boolean): ColorTheme {
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return systemPrefersDark ? "dark" : "light";
}

function systemColorTheme(): ColorTheme {
  if (typeof window === "undefined") return "light";
  return resolveColorTheme(null, window.matchMedia(darkThemeQuery).matches);
}

export function currentColorTheme(): ColorTheme {
  if (typeof document !== "undefined") {
    const appliedTheme = document.documentElement.dataset.theme;
    if (appliedTheme === "light" || appliedTheme === "dark") {
      return appliedTheme;
    }
  }
  return storedColorTheme() || systemColorTheme();
}

export function applyColorTheme(theme: ColorTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function initializeColorTheme() {
  const theme = storedColorTheme() || systemColorTheme();
  applyColorTheme(theme);
  return theme;
}

export function useColorTheme() {
  const [theme, setTheme] = useState<ColorTheme>(currentColorTheme);

  useEffect(() => {
    applyColorTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (storedColorTheme()) return;
    const media = window.matchMedia(darkThemeQuery);
    const handleChange = (event: MediaQueryListEvent) => setTheme(event.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(colorThemeStorageKey, nextTheme);
      } catch {
        // The active page still switches even when browser storage is unavailable.
      }
      return nextTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
