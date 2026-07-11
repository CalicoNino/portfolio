import { useEffect } from "react";
import { themes, type ThemeKey } from "./themes";

/** Applies the active language theme's color variables to :root. */
export function useThemeColors(activeTheme: ThemeKey, isDark: boolean) {
  useEffect(() => {
    const theme = themes[activeTheme];
    const root = document.documentElement;
    root.style.setProperty("--primary", isDark ? theme.colors.primaryDark : theme.colors.primary);
    root.style.setProperty("--accent", isDark ? theme.colors.accentDark : theme.colors.accent);
    root.style.setProperty("--bg-1", theme.colors.bg1);
    root.style.setProperty("--bg-2", theme.colors.bg2);
    root.style.setProperty("--bg-3", theme.colors.bg3);
  }, [activeTheme, isDark]);
}
