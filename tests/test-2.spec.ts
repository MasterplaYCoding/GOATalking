import { test, expect } from '@playwright/test';

test('testing exceptions, updating, and view synchronization', async ({ page }) => {
  test.setTimeout(120000);

  await page.goto('http://localhost:5173/your-polls');
  await page.getByRole('button', { name: 'add Add' }).click();

  await page.getByRole('textbox', { name: 'E.g., What is your go-to' }).fill('aaa');
  await page.getByRole('textbox', { name: 'Add some context to your poll' }).fill('aaaaaaaaaa');
  await page.getByRole('textbox', { name: 'Option 1' }).fill('bbbbb');
  await page.getByRole('textbox', { name: 'Option 2' }).fill('ccccc');
  await page.getByRole('button', { name: 'Create Poll' }).click();
  await expect(page.getByText('at least 5', { exact: false })).toBeVisible();

  await page.getByRole('textbox', { name: 'E.g., What is your go-to' }).fill('aaaaa');
  await page.getByRole('textbox', { name: 'Add some context to your poll' }).fill('aaa');
  await page.getByRole('button', { name: 'Create Poll' }).click();
  await expect(page.getByText('at least 10', { exact: false })).toBeVisible();

  await page.getByRole('textbox', { name: 'Add some context to your poll' }).fill('aaaaaaaaaa');
  await page.getByRole('textbox', { name: 'Option 2' }).fill('bbbbb');
  await page.getByRole('button', { name: 'Create Poll' }).click();
  await expect(page.getByText('Poll options must be unique.', { exact: false })).toBeVisible();

  await page.getByRole('textbox', { name: 'Option 2' }).fill('ccccc');
  await page.getByRole('button', { name: 'Create Poll' }).click();
  await expect(page.getByText('aaaaa', { exact: false }).first()).toBeVisible();

  await page.getByRole('button', { name: 'add Add' }).click();
  await page.getByRole('textbox', { name: 'E.g., What is your go-to' }).fill('yyyyy');
  await page.getByRole('textbox', { name: 'Add some context to your poll' }).fill('yyyyyyyyyy');
  await page.getByRole('textbox', { name: 'Option 1' }).fill('qqqqq');
  await page.getByRole('textbox', { name: 'Option 2' }).fill('wwwww');
  await page.getByRole('button', { name: 'Create Poll' }).click();
  await expect(page.getByText('yyyyy', { exact: false }).first()).toBeVisible();

  await page.getByRole('button', { name: 'table_rows' }).click();

  await page.getByText('aaaaa', { exact: false }).first().click();
  await page.getByRole('button', { name: 'edit Update' }).click();
  await page.getByRole('textbox', { name: 'Poll title' }).dblclick();
  await page.getByRole('textbox', { name: 'Poll title' }).press('ControlOrMeta+a');
  await page.getByRole('textbox', { name: 'Poll title' }).fill('aaaaaaa');
  await page.getByRole('button', { name: 'Update Poll' }).click();
  await expect(page.getByText('aaaaaaa', { exact: false }).first()).toBeVisible();

  await page.getByText('aaaaaaa', { exact: false }).first().click();
  await page.getByRole('button', { name: 'delete Delete' }).click();

  await page.getByText('yyyyy', { exact: false }).first().click();
  await page.getByRole('button', { name: 'delete Delete' }).click();

  await page.getByRole('button', { name: 'grid_view' }).click();

  await expect(page.getByText('aaaaaaa', { exact: false })).toHaveCount(0);
  await expect(page.getByText('yyyyy', { exact: false })).toHaveCount(0);
});