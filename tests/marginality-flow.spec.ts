import { expect, test, type Page } from "@playwright/test";
import { openMarginalityTests } from "./helpers";

async function setAgreement(page: Page, value: number) {
  await page.locator('input[type="range"]').evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const prototype = Object.getPrototypeOf(input);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(input, String(nextValue));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

test("user can start a marginality test and move to the first question", async ({ page }) => {
  await openMarginalityTests(page);

  await page.getByRole("button", { name: /Football Tribalism and Legacy/i }).click();
  await expect(page.getByRole("heading", { name: "Football Tribalism and Legacy" })).toBeVisible();

  await page.locator('input[type="number"]').fill("27");
  await page.locator("input").nth(1).fill("Romania");
  await page.locator("select").selectOption("Weekly");
  await page.locator("input").nth(2).fill("Barcelona");

  await page.getByRole("button", { name: "Start Test" }).click();

  await expect(page).toHaveURL(/\/questions\/0$/);
  await expect(page.getByText(/Question 1 of 10/)).toBeVisible();
  await expect(page.getByText(/Modern football is too tactical/i)).toBeVisible();
});

test("question screen reveals live stats after the user votes", async ({ page }) => {
  await openMarginalityTests(page);

  await page.getByRole("button", { name: /Football Tribalism and Legacy/i }).click();
  await page.locator('input[type="number"]').fill("31");
  await page.locator("input").nth(1).fill("Romania");
  await page.locator("select").selectOption("Obsessed");
  await page.locator("input").nth(2).fill("Barcelona");
  await page.getByRole("button", { name: "Start Test" }).click();

  await setAgreement(page, 82);
  await expect(page.getByRole("button", { name: "See stats" })).toBeEnabled();

  await expect(page.getByText(/You are .* than the current average on this take/i)).toBeVisible();
  await page.getByRole("button", { name: "See stats" }).click();

  await expect(page.getByText(/The current overall average is/i)).toBeVisible();
  await expect(page.getByText(/Your generation is/i)).toBeVisible();
});

test("marginality start page shows validation errors for missing required fields", async ({ page }) => {
  await openMarginalityTests(page);

  await page.getByRole("button", { name: /Football Tribalism and Legacy/i }).click();
  await page.getByRole("button", { name: "Start Test" }).click();

  await expect(page.getByText("Age is required.")).toBeVisible();
  await expect(page.getByText("Country is required.")).toBeVisible();
  await expect(page.getByText("Football Watching Level is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/take$/);
});
