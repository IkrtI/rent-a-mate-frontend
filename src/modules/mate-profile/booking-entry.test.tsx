import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { BookingEntry } from "./booking-entry";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("books the selected duration and start time inside an open interval", async () => {
  const fetchMock = vi.fn().mockImplementation((url: string) =>
    Promise.resolve(
      url.startsWith("/api/mates/")
        ? new Response(
            JSON.stringify({
              openSlots: [
                { start: "09:00", end: "12:00" },
                { start: "13:00", end: "16:00" },
              ],
            }),
            { status: 200 },
          )
        : new Response(JSON.stringify({ id: 42 }), { status: 201 }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(
    <BookingEntry
      activities={[{ id: 2, name: "Coffee" }]}
      hourlyRate={300}
      initialDate="2099-10-10"
      mateId={5}
    />,
  );

  await screen.findByRole("button", { name: "09:00" });
  fireEvent.change(screen.getByLabelText("2. How long do you need your Mate?"), {
    target: { value: "3" },
  });
  expect(screen.queryByRole("button", { name: "09:30" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "09:00" }));
  expect(screen.getByText("Estimated total")).toHaveTextContent("฿900");
  fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));

  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bookings",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          mateId: 5,
          activityId: 2,
          date: "2099-10-10",
          startTime: "09:00",
          endTime: "12:00",
        }),
      }),
    ),
  );
  expect(await screen.findByText(/Booking request sent successfully/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Send booking request" })).toBeDisabled();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
