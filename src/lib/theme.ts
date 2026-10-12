/**
 * The theme is mirrored into localStorage because IndexedDB is async and the theme
 * must be applied synchronously before the first paint (otherwise it flashes light).
 */
export const THEME_KEY = "168hrs:theme";

export function readSavedTheme(): "light" | "dark" {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t) return t === "dark" ? "dark" : "light";
    // Before the first Dexie migration the theme only exists inside the old settings blob
    const legacy = localStorage.getItem("168hrs:settings");
    if (legacy)
      return (JSON.parse(legacy) as { theme?: string }).theme === "dark" ? "dark" : "light";
  } catch {
    /* ignore */
  }
  return "dark";
}

export function saveTheme(theme: unknown) {
  if (theme !== "dark" && theme !== "light") return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function clearTheme() {
  try {
    localStorage.removeItem(THEME_KEY);
  } catch {
    /* ignore */
  }
}
