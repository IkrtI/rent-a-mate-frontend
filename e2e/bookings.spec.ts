import { expect, test } from "@playwright/test";

const booking = {
  id: 42,
  status: "pending",
  date: "2026-10-01T00:00:00.000Z",
  startTime: "2026-10-01T03:00:00.000Z",
  endTime: "2026-10-01T05:00:00.000Z",
  totalPrice: "700.00",
  createdAt: "2026-09-23T00:00:00.000Z",
  updatedAt: "2026-09-23T00:00:00.000Z",
  renter: { id: 7, name: "Mew" },
  mate: { id: 11, name: "Nan" },
  activity: { id: 3, name: "Cafe hopping" },
  review: null,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: 7, name: "Mew", role: "renter" } }),
    }),
  );
});

test("lists bookings and opens booking details", async ({ page }) => {
  await page.route("**/api/bookings?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [booking],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    }),
  );
  await page.route("**/api/bookings/42", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(booking) }),
  );

  await page.goto("/bookings");
  await expect(page.getByText("Cafe hopping with Nan")).toBeVisible();
  await page.getByText("Cafe hopping with Nan").click();
  await expect(page).toHaveURL(/\/bookings\/42$/);
  await expect(page.getByRole("heading", { name: "Cafe hopping with Nan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel booking" })).toBeVisible();
});
