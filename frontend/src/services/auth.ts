import { apiFetch } from "./api";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from "../types/auth";

export const authApi = {
  register(data: RegisterRequest): Promise<User> {
    return apiFetch<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: LoginRequest): Promise<TokenResponse> {
    return apiFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  me(): Promise<User> {
    return apiFetch<User>("/api/auth/me");
  },
};
