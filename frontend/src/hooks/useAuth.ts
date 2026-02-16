import { useContext } from "react";
import { AuthContext } from "../contexts/authDefinitions";

export function useAuth() {
  return useContext(AuthContext);
}
