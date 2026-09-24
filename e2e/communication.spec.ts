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

test("opens notifications and marks an item read", async ({ page }) => {
  await page.route("**/api/notifications", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        notifications: [
          {
            id: 3,
            userId: 7,
            type: "booking_confirmed",
            message: "Your booking request has been confirmed",
            bookingId: 42,
            isRead: false,
            createdAt: "2026-09-23T03:00:00.000Z",
          },
        ],
      }),
    }),
  );
  await page.route("**/api/notifications/3/read", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ notification: { id: 3 } }),
    }),
  );

  await page.goto("/dashboard");
  await page.getByTitle("Notifications").click();
  await expect(page.getByText("Your booking request has been confirmed")).toBeVisible();
});

test("lists conversations and sends a REST message", async ({ page }) => {
  await page.route("**/api/bookings?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [booking],
        meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
      }),
    }),
  );
  let messages: Array<{
    id: number;
    bookingId: number;
    senderId: number;
    content: string;
    readAt: string | null;
    createdAt: string;
  }> = [
    {
      id: 1,
      bookingId: 42,
      senderId: 7,
      content: "See you there!",
      readAt: "2026-09-23T03:01:00.000Z",
      createdAt: "2026-09-23T03:00:00.000Z",
    },
  ];
  await page.route("**/api/bookings/42/messages*", async (route) => {
    if (route.request().method() === "POST") {
      const input = (await route.request().postDataJSON()) as {
        clientMessageId: string;
        content: string;
      };
      expect(input.clientMessageId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      const message = {
        id: 2,
        bookingId: 42,
        senderId: 7,
        content: input.content,
        readAt: null,
        createdAt: "2026-09-23T03:05:00.000Z",
      };
      messages = [...messages, message];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(message),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: messages,
        meta: { page: 1, limit: 100, total: messages.length, totalPages: 1 },
      }),
    });
  });

  await page.goto("/messages/42");
  await expect(page.getByText("See you there!")).toBeVisible();
  await expect(page.getByText(/· Read$/)).toBeVisible();
  await page.getByLabel("Message").fill("On my way");
  await page.getByTitle("Send message").click();
  await expect(page.getByText("On my way")).toBeVisible();
});
