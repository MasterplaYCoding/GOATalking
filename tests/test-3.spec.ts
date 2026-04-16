import { test, expect } from '@playwright/test';

test('User can complete the Football Marginality Test', async ({ page }) => {
  test.setTimeout(120000);

  await page.goto('http://localhost:5173/marginality-test');
  
  await page.getByRole('button', { name: 'Football 10 questions' }).click();
  
  await page.getByPlaceholder('e.g. 27').fill('24');
  await page.getByRole('button', { name: 'Start Test' }).click();
  
  await page.getByRole('textbox', { name: 'e.g. Romania' }).fill('Romania');
  await page.getByRole('combobox').selectOption('Casual');
  await page.getByRole('button', { name: 'Start Test' }).click();
  
  await page.getByRole('slider').fill('66');
  await page.getByRole('button', { name: 'See stats' }).click();
  await page.getByRole('button', { name: 'Hide stats' }).click();
  await page.getByRole('button', { name: 'See stats' }).click();
  await page.getByRole('button', { name: 'Hide stats' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('19');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('66');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('23');
  await page.getByRole('button', { name: 'See stats' }).click();
  await page.getByRole('slider').fill('29');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('62');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('62');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('66');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('67');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('70');
  await page.getByRole('button', { name: 'Next' }).click();
  
  await page.getByRole('slider').fill('69');
  await page.getByRole('button', { name: 'Finish Test' }).click();
  
  await page.getByRole('button', { name: 'Return to Tests' }).click();
  
  await expect(page.getByRole('button', { name: 'Football 10 questions' })).toBeVisible();
});