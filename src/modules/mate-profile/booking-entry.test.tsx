import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BookingEntry } from "./booking-entry";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BookingEntry", () => {
  it("shows success for the unwrapped booking response and prevents a duplicate submit", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url.startsWith("/api/mates/")
                ? { openSlots: [{ start: "09:00", end: "10:00" }] }
                : { id: 42, status: "pending", totalPrice: "300.00" },
            ),
            { status: url.startsWith("/api/mates/") ? 200 : 201 },
          ),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingEntry
        mateId={3}
        activities={[{ id: 2, name: "Coffee" }]}
        initialDate="2026-10-01"
        hourlyRate={300}
      />,
    );

    const time = await screen.findByRole("option", { name: "09:00 – 10:00" });
    fireEvent.change(time.closest("select")!, { target: { value: "09:00-10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Send booking request" }));

    expect(await screen.findByText(/Booking request sent successfully/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send booking request" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
