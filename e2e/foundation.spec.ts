import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("serves the UI-free foundation without accessibility violations", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /\/icon\.svg/);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("keeps the public footer visible in dark theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mateflow-theme", "light"));
  await page.goto("/");

  await page.locator(".desktop-theme-toggle").click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  const footer = page.locator(".site-footer");
  const copyright = footer.locator(".copyright");
  const steps = page.locator(".steps-section");

  await expect(steps).toHaveCSS("background-color", "rgb(30, 29, 34)");
  await expect
    .poll(async () => {
      const box = await steps.boundingBox();
      return box && { x: box.x, width: box.width };
    })
    .toEqual({ x: 0, width: 1280 });

  await expect(footer).toHaveCSS("background-color", "rgb(32, 33, 42)");
  await expect(footer).toHaveCSS("border-top-color", "rgba(255, 255, 255, 0.22)");
  await expect(footer.locator(".brand")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(footer.locator(".footer-brand p")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(footer.locator(".footer-nav a").first()).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(copyright).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(copyright).toHaveCSS("border-top-color", "rgba(255, 255, 255, 0.22)");
});
