import { test, expect } from '@playwright/test';

test('User hits login errors, votes, and searches for missing polls', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.pause();
  await expect(page.getByText('Password is required.', { exact: false }).first()).toBeVisible();
  await page.locator('input[type="text"]').fill('aaa@gmail.com');
  await page.locator('input[type="password"]').fill('aaaaa');
  await page.getByRole('button', { name: 'Log In' }).click();

  await page.getByText('Pelé', { exact: false }).first().click();
  await page.getByText('Johan Cruyff', { exact: false }).first().click();

  const searchBox = page.getByRole('textbox', { name: 'Search polls...' });
  
  await searchBox.fill('burger');
  await searchBox.press('Enter');

  await searchBox.fill('breaking bad');
  await searchBox.press('Enter');

  await expect(page.getByText('No polls found')).toBeVisible();

  await searchBox.fill('destina');
  await searchBox.press('Enter');
  
  await page.getByText('Japan', { exact: false }).first().click();
  await page.getByText('Italy', { exact: false }).first().click();
  
  await searchBox.fill('');
  await page.getByText('New Zealand', { exact: false }).first().click();

  await expect(page.getByText('New Zealand', { exact: false }).first()).toBeVisible();
});