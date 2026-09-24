import { expect, test } from "@playwright/test";

test("public discovery filters seeded demos and opens a mate profile", async ({ page }) => {
  const home = await page.goto("/");
  expect(home?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: /Find the right mate/ })).toBeVisible();

  const discovery = await page.goto("/mates?activity=Gaming");
  expect(discovery?.ok()).toBe(true);
  await expect(page.getByText("1 Mate to meet for Gaming")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mew" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nan" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ploy" })).toHaveCount(0);

  await page.getByRole("link", { name: "View Mew's profile" }).click();
  await expect(page).toHaveURL(/\/mates\/2$/);
  await expect(page.getByRole("heading", { name: /Hi, I’m Mew\./ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "About me" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Things we can do" })).toBeVisible();
  await expect(page.getByText(/Sign in is required to request a booking\./)).toBeVisible();
  await expect(page.getByRole("button", { name: "Send booking request" })).toBeDisabled();
});

test("public search matches a seeded demo profile by bio text", async ({ page }) => {
  const response = await page.goto("/mates?q=coffee");
  expect(response?.ok()).toBe(true);
  await expect(page.getByText("1 Mate to meet")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mew" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ploy" })).toHaveCount(0);
});

test("signup stops at the required policy acknowledgement and guest session stays empty", async ({
  page,
}) => {
  const response = await page.request.get("/api/auth/session");
  expect(response.status()).toBe(401);
  expect(await response.json()).toMatchObject({ error: { code: "SESSION_REQUIRED" } });

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "What brings you here?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /I agree to the Terms and Privacy Policy/ }),
  ).not.toBeChecked();
  await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");

  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
});

test("private communication and administration pages redirect guests to sign in", async ({
  page,
}) => {
  for (const path of ["/dashboard", "/bookings", "/messages", "/messages/1", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await expect(page.getByRole("heading", { name: "Pick up where you left off." })).toBeVisible();
  }

  for (const path of [
    "/api/bookings",
    "/api/bookings/1/messages",
    "/api/notifications",
    "/api/admin/analytics",
  ]) {
    const response = await page.request.get(path);
    expect(response.status(), `${path} should require a session`).toBe(401);
  }
});
