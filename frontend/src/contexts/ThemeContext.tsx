import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, THEMES, STORAGE_KEY } from "./themeDefinitions";

function applyTheme(id: string) {
  if (id === "cosmos") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", id);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "cosmos";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(id: string) {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

