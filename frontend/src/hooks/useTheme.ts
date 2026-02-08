import { useContext } from "react";
import { ThemeContext } from "../contexts/themeDefinitions";

export function useTheme() {
  return useContext(ThemeContext);
}
