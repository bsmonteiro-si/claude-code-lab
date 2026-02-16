import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe.configure({ mode: "serial" });

  const timestamp = Date.now();
  const newUser = {
    displayName: `User ${timestamp}`,
    email: `user-${timestamp}@promptlab.com`,
    password: "securepass123",
  };

  test("register a new account and land on the home page", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: "Create one" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Account" }),
    ).toBeVisible();

    await page.getByLabel("Display Name").fill(newUser.displayName);
    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password").fill(newUser.password);
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/");
    await expect(page.getByText(newUser.displayName)).toBeVisible();
    await expect(page.getByText("Welcome to the LLM Prompt Lab.")).toBeVisible();
  });

  test("login with existing account", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password").fill(newUser.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");
    await expect(page.getByText(newUser.displayName)).toBeVisible();
  });

  test("registration fails with duplicate email", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Display Name").fill("Duplicate");
    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password").fill("anotherpass123");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(
      page.getByText("Registration failed. Email may already be in use."),
    ).toBeVisible();
  });

  test("login fails with wrong password", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Invalid email or password."),
    ).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/templates");

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "LLM Prompt Lab" }),
    ).toBeVisible();
  });

  test("logout returns to login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password").fill(newUser.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/");

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
