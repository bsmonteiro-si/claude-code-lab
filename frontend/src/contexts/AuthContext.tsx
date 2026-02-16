import { useCallback, useEffect, useState, type ReactNode } from "react";
import { authApi } from "../services/auth";
import { getToken, setToken, clearToken } from "../services/api";
import type { User, LoginRequest, RegisterRequest } from "../types/auth";
import { AuthContext } from "./authDefinitions";

function hasStoredToken(): boolean {
  return getToken() !== null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(hasStoredToken);

  useEffect(() => {
    if (!isLoading) return;

    authApi
      .me()
      .then(setUser)
      .catch(() => {
        clearToken();
      })
      .finally(() => setIsLoading(false));
  }, [isLoading]);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    setToken(response.access_token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
    const response = await authApi.login({
      email: data.email,
      password: data.password,
    });
    setToken(response.access_token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
