import { expect, test } from "@playwright/test";
import { openDashboard } from "./helpers";

test("user can create a poll from the dashboard", async ({ page }) => {
  await openDashboard(page);

  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: "Create New Poll" })).toBeVisible();

  await page.getByPlaceholder("E.g., What is your go-to morning drink?").fill("Who had the better prime?");
  await page.getByPlaceholder("Add some context to your poll...").fill("A quick end-to-end test poll.");
  await page.getByPlaceholder("https://...").fill("/logo.png");
  await page.getByPlaceholder("Option 1").fill("Messi");
  await page.getByPlaceholder("Option 2").fill("Ronaldo");

  await page.getByRole("button", { name: "Create Poll" }).click();

  await expect(page).toHaveURL(/\/your-polls$/);
  await expect(page.getByText("Who had the better prime?")).toBeVisible();
});

test("poll creation shows validation errors for incomplete input", async ({ page }) => {
  await openDashboard(page);

  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: "Create New Poll" })).toBeVisible();

  await page.getByPlaceholder("E.g., What is your go-to morning drink?").fill("abc");
  await page.getByPlaceholder("Add some context to your poll...").fill("short");
  await page.getByPlaceholder("Option 1").fill("Messi");
  await page.getByPlaceholder("Option 2").fill("messi");

  await page.getByRole("button", { name: "Create Poll" }).click();

  await expect(page.getByText("Title should have at least 5 characters.")).toBeVisible();
  await expect(page.getByText("Description should have at least 10 characters.")).toBeVisible();
  await expect(page.getByText("Poll options must be unique.")).toBeVisible();
  await expect(page).toHaveURL(/\/create-poll$/);
});

test("dashboard CRUD demo thread visibly adds and deletes demo polls", async ({ page }) => {
  await openDashboard(page);

  await page.getByRole("button", { name: "Run CRUD demo thread" }).click();

  await expect(page.getByText("Live CRUD Demo Poll")).toBeVisible();
  await expect(page.getByText("Second Demo Poll")).toBeVisible({ timeout: 3000 });
  await expect(page.getByText("Live CRUD Demo Poll")).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Second Demo Poll")).not.toBeVisible({ timeout: 6000 });
});
