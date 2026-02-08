import { test, expect } from "@playwright/test";
import { cleanDatabase } from "./cleanup";

test.describe("Smoke Tests", () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });
  test("app loads and displays the home page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("LLM Prompt Lab");
    await expect(page.getByText("LLM Prompt Lab").first()).toBeVisible();
    await expect(page.getByText("Welcome to the LLM Prompt Lab.")).toBeVisible();
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Templates" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pipelines" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Executions" })).toBeVisible();
  });

  test("theme switcher changes the active theme", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");

    await expect(html).not.toHaveAttribute("data-theme");

    await page.getByTitle("Ocean Depths").click();
    await expect(html).toHaveAttribute("data-theme", "ocean");

    await page.getByTitle("Purple Cosmos").click();
    await expect(html).not.toHaveAttribute("data-theme");
  });

  test("templates page loads with backend connection", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Templates" }).click();

    await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Template" })).toBeVisible();
  });
});
