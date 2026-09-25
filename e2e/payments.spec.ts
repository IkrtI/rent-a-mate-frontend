import { expect, test } from "@playwright/test";

const booking = {
  id: 42,
  status: "confirmed",
  date: "2026-10-01T00:00:00.000Z",
  startTime: "2026-10-01T03:00:00.000Z",
  endTime: "2026-10-01T05:00:00.000Z",
  totalPrice: "700.00",
  createdAt: "2026-09-23T00:00:00.000Z",
  updatedAt: "2026-09-23T00:00:00.000Z",
  renter: { id: 7, name: "Pat" },
  mate: { id: 11, name: "Nan" },
  activity: { id: 3, name: "Cafe" },
  review: null,
};

test("completes a local test payment without Stripe credentials", async ({ page }) => {
  let paymentStatus = "pending";
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: 7, name: "Pat", role: "renter" } }),
    }),
  );
  await page.route("**/api/bookings/42", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(booking) }),
  );
  await page.route("**/api/bookings/42/payment", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          bookingId: 42,
          status: "pending",
          clientSecret: "local_mock_client_secret_42",
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bookingId: 42,
        amount: "700.00",
        status: paymentStatus,
        providerReference: paymentStatus === "pending" ? null : "local_mock_42",
        paidAt: paymentStatus === "pending" ? null : "2026-09-25T10:00:00.000Z",
        failedAt: null,
        refundedAt: null,
      }),
    });
  });
  await page.route("**/api/bookings/42/payment/confirm", (route) => {
    paymentStatus = "paid";
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        bookingId: 42,
        amount: "700.00",
        status: "paid",
        providerReference: "local_mock_42",
        paidAt: "2026-09-25T10:00:00.000Z",
        failedAt: null,
        refundedAt: null,
      }),
    });
  });

  await page.goto("/bookings/42");
  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page.getByText("Local test payment. No card will be charged.")).toBeVisible();
  await page.getByRole("button", { name: "Complete test payment" }).click();
  await expect(page.getByText("Payment successful.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete test payment" })).toHaveCount(0);
});
