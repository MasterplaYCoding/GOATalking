import { expect, type Page } from "@playwright/test";

export async function openDashboard(page: Page) {
  await page.goto("/your-polls");
  await expect(page).toHaveURL(/\/your-polls$/);
  await expect(page.getByRole("heading", { name: "Creator Dashboard" })).toBeVisible();
}

export async function openMarginalityTests(page: Page) {
  await page.goto("/marginality-test");
  await expect(page).toHaveURL(/\/marginality-test$/);
}
