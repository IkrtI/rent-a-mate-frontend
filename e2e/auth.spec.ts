import { expect, test } from "@playwright/test";

test("shows login validation and the two-step signup flow", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Good to see you." })).toBeVisible();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "How will you use mateflow?" })).toBeVisible();
  await page.getByRole("button", { name: /I want to become a mate/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "A few details first." })).toBeVisible();
});

test("redirects a guest from a private route to sign in", async ({ page }) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ user: null }),
    }),
  );

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard/);
});

test("renders the private shell for an authenticated user", async ({ page }) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: 7, name: "Mew", role: "renter" } }),
    }),
  );
  await page.route("**/api/bookings?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
      }),
    }),
  );

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Good morning, Mew." })).toBeVisible();
  await expect(page.getByText("Mew", { exact: true })).toBeVisible();
  await expect(page.getByText("No upcoming bookings yet.")).toBeVisible();
});
