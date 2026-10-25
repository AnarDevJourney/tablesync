import { theme as antdTheme, type ThemeConfig } from "antd";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "tablesync-site-theme";

// AntD follows the same tokens as styles.css
export function antdThemeFor(mode: ThemeMode): ThemeConfig {
  const dark = mode === "dark";
  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: dark ? "#14b8a6" : "#0f766e",
      colorInfo: dark ? "#14b8a6" : "#0f766e",
      colorBgLayout: dark ? "#0b1416" : "#f6f8f8",
      colorBgContainer: dark ? "#111c1f" : "#ffffff",
      colorBgElevated: dark ? "#142226" : "#ffffff",
      colorBorder: dark ? "#2f4146" : "#d5dddd",
      colorBorderSecondary: dark ? "#25353a" : "#e3e8e8",
      colorText: dark ? "#e8eef0" : "#1f2933",
      colorTextSecondary: dark ? "#93a3a8" : "#5f6b73",
      colorFillAlter: dark ? "#18272b" : "#f1f5f5",
      fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
      borderRadius: 8,
      borderRadiusLG: 12,
    },
  };
}

const initialMode = (): ThemeMode =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

const ThemeContext = createContext<{ mode: ThemeMode; toggle: () => void }>({
  mode: "light",
  toggle: () => {},
});

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const toggle = () =>
    setMode((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // private mode: the choice lasts for this visit only
      }
      return next;
    });

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>{children}</ThemeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeContext);
