import { expect, test } from "@playwright/test";

test("shows login validation and the two-step signup flow", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Pick up where you left off." })).toBeVisible();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "What brings you here?" })).toBeVisible();
  await page.getByRole("button", { name: /I want to become a mate/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();
});

test("keeps the light theme when an old dark preference is saved", async ({ page }) => {
  const user = { id: 7, name: "Mew", role: "renter" };
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("mateflow-theme", "dark"));

  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user }) }),
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

  await page.goto("/login");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toHaveCount(0);

  await page.goto("/signup");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Good morning, Mew." })).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toHaveCount(0);
});

test("uses the requested role for mate sign-up and submits only backend fields", async ({
  page,
}) => {
  let registration: Record<string, unknown> | undefined;
  await page.route("**/api/auth/register", async (route) => {
    registration = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: 12, name: "Mew", email: "mew@example.test", role: "mate" },
      }),
    });
  });

  await page.goto("/signup?role=mate");
  await expect(page.getByRole("button", { name: /I want to become a mate/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Mew");
  await page.getByLabel("Email address").fill("mew@example.test");
  await page.getByLabel("Password", { exact: true }).fill("synthetic-test-password");
  await page.getByLabel("Confirm password").fill("synthetic-test-password");
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1/);
  expect(registration).toEqual({
    name: "Mew",
    email: "mew@example.test",
    password: "synthetic-test-password",
    role: "mate",
  });
});

test("registers a standard account as a renter", async ({ page }) => {
  let registration: Record<string, unknown> | undefined;
  await page.route("**/api/auth/register", async (route) => {
    registration = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: 13, name: "Pat", email: "pat@example.test", role: "renter" },
      }),
    });
  });

  await page.goto("/signup");
  await expect(page.getByRole("button", { name: /I want to find a mate/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Pat");
  await page.getByLabel("Email address").fill("pat@example.test");
  await page.getByLabel("Password", { exact: true }).fill("synthetic-test-password");
  await page.getByLabel("Confirm password").fill("synthetic-test-password");
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1/);
  expect(registration).toMatchObject({ role: "renter" });
});

test("keeps the logged-in account visible after returning home", async ({ page }) => {
  const user = { id: 12, name: "Mew", email: "mew@example.test", role: "mate" };
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user }) }),
  );
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user }) }),
  );

  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password").fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/");

  await expect(page.getByRole("link", { name: "My account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up" })).toHaveCount(0);
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
  await expect(page.getByRole("link", { name: "Find a Mate" }).first()).toHaveAttribute(
    "href",
    "/mates",
  );
});

test("shows Mate profile and weekly hours without crowding the desktop navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: 8, name: "Mew Mate", role: "mate" } }),
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
  await page.route("**/api/mates/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        mate: {
          id: 4,
          user: { id: 8, name: "Mew Mate" },
          age: 24,
          bio: null,
          hourlyRate: 350,
          isActive: true,
          deactivatedAt: null,
          province: { id: 10, name: "Bangkok" },
          district: { id: 1001, name: "Phra Nakhon" },
          activities: [],
          interests: [],
          photos: [
            {
              id: 1,
              mateId: 4,
              url: "/pictures/auth-companions.png",
              storageKey: null,
              sortOrder: 0,
            },
          ],
          availability: [],
        },
      }),
    }),
  );

  await page.goto("/dashboard");
  await expect(page.getByAltText("Mew Mate's profile photo")).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Private navigation" });
  const accountActions = page.locator(".account-actions");
  const navigationBox = await navigation.boundingBox();
  const accountActionsBox = await accountActions.boundingBox();

  expect(navigationBox).not.toBeNull();
  expect(accountActionsBox).not.toBeNull();
  expect(navigationBox!.x + navigationBox!.width).toBeLessThan(accountActionsBox!.x);

  await expect(navigation.getByRole("link", { name: "Profile" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Weekly hours" })).toBeVisible();
  await expect(page.getByText("Mate tools", { exact: true })).toHaveCount(0);
});
