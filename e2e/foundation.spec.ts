import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("serves the UI-free foundation without accessibility violations", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /\/icon\.svg/);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("keeps the public footer visible in the light theme", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toHaveCount(0);

  const footer = page.locator(".site-footer");
  const steps = page.locator(".steps-section");

  await expect
    .poll(async () => {
      const box = await steps.boundingBox();
      return box && { x: box.x, width: box.width };
    })
    .toEqual({ x: 0, width: 1280 });

  await expect(footer).toBeVisible();
  await expect(footer.locator(".brand")).toBeVisible();
});
