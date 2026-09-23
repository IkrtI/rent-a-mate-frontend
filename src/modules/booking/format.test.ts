import { describe, expect, it } from "vitest";

import { formatBookingDate, formatBookingTime, formatPrice } from "./format";

describe("booking formatting", () => {
  it("formats booking time in Asia/Bangkok", () => {
    expect(formatBookingDate("2026-09-23T17:00:00.000Z")).toBe("24 Sept 2026");
    expect(formatBookingTime("2026-09-23T03:30:00.000Z")).toBe("10:30");
  });

  it("formats decimal API prices as Thai baht", () => {
    expect(formatPrice("700.00")).toContain("700");
  });
});
