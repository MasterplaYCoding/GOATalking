import { expect, test } from "@playwright/test";

test("login form blocks invalid input and shows validation messages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log In" }).click();

  await page.locator("input").nth(0).fill("bad-email");
  await page.locator("input").nth(1).fill("");
  await page.getByRole("button", { name: "Log In" }).click();

  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Password is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("user can log in from the presentation flow and reach the feed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "GOATalking" })).toBeVisible();

  await page.getByRole("button", { name: "Log In" }).click();
  await page.locator("input").nth(0).fill("demo@example.com");
  await page.locator("input").nth(1).fill("Password1");
  await page.getByRole("button", { name: "Log In" }).click();

  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.getByRole("heading", { name: "Feed" })).toBeVisible();
});
