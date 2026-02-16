import type { Page } from "@playwright/test";

const API_BASE = "http://localhost:8001";

export const TEST_USER = {
  display_name: "Test User",
  email: "test@promptlab.com",
  password: "testpass123",
};

interface TokenResponse {
  access_token: string;
  user: { id: number; email: string; display_name: string };
}

async function apiRegister(user: typeof TEST_USER): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`Register failed: ${res.status}`);
  }
}

async function apiLogin(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json() as Promise<TokenResponse>;
}

export async function ensureTestUser(): Promise<string> {
  await apiRegister(TEST_USER);
  const response = await apiLogin(TEST_USER.email, TEST_USER.password);
  return response.access_token;
}

export async function loginViaUi(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("/");
}
