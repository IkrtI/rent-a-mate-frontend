import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("serves the UI-free foundation without accessibility violations", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
