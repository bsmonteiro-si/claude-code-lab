import { createContext } from "react";

export interface ThemeDefinition {
  id: string;
  label: string;
  color: string;
}

export interface ThemeContextValue {
  theme: string;
  setTheme: (id: string) => void;
  themes: ThemeDefinition[];
}

export const THEMES: ThemeDefinition[] = [
  { id: "cosmos", label: "Purple Cosmos", color: "#8b5cf6" },
  { id: "ocean", label: "Ocean Depths", color: "#0ea5e9" },
  { id: "emerald", label: "Emerald Forest", color: "#10b981" },
  { id: "sunset", label: "Sunset Blaze", color: "#f59e0b" },
  { id: "clear", label: "Clear Sky", color: "#e2e8f0" },
];

export const STORAGE_KEY = "llm-prompt-lab-theme";

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "cosmos",
  setTheme: () => {},
  themes: THEMES,
});
