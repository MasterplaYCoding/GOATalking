import { test, expect } from '@playwright/test';

test.use({ ignoreHTTPSErrors: true });

test('Simulate aggressive dictionary brute-force attack', async ({ page }) => {
  test.setTimeout(180000);

  await page.goto('https://localhost:5173/login');

  const passwordDictionary = [
    'admin', 'password', '123456', 'qwerty', 'letmein123',
    'admin1234', 'welcome', 'hunter2', 'spring2024', 'root',
    'p@ssword', 'secure123', 'goatalking', 'test1234', 'hacked'
  ];

  const targetEmail = 'mateiursache2710+admin@gmail.com';

  for (const [index, attempt] of passwordDictionary.entries()) {
    const emailInput = page.locator('input[type="text"], input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill('');
    await passwordInput.fill('');

    await emailInput.pressSequentially(targetEmail, { delay: 15 });
    await passwordInput.pressSequentially(attempt, { delay: 15 });
    
    await page.getByRole('button', { name: 'Continue' }).click();
    
    await expect(page.locator('text=Login failed')).toBeVisible({ timeout: 5000 }).catch(() => {});
    
    console.log(`[ATTACK] Attempt ${index + 1}/${passwordDictionary.length} failed: ${attempt}`);
    
    await page.waitForTimeout(200);
  }
});