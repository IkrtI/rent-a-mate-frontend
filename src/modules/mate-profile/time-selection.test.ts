import { describe, expect, it } from "vitest";

import { availableStarts, isCalendarDate, isCurrentOrFutureDate } from "./time-selection";

describe("booking start times", () => {
  it("offers only durations fully contained by an open window", () => {
    const windows = [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "16:00" },
    ];
    expect(availableStarts(windows, 180)).toEqual(["09:00", "13:00"]);
    expect(availableStarts(windows, 120)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "13:00",
      "13:30",
      "14:00",
    ]);
  });

  it("excludes times already in the past on the selected day", () => {
    expect(availableStarts([{ start: "09:00", end: "12:00" }], 60, 10 * 60 + 1)).toEqual([
      "10:30",
      "11:00",
    ]);
  });
});

describe("booking calendar dates", () => {
  const today = "2026-09-30";

  it("allows today and future dates", () => {
    expect(isCurrentOrFutureDate(today, today)).toBe(true);
    expect(isCurrentOrFutureDate("2026-10-01", today)).toBe(true);
  });

  it("rejects past and impossible dates", () => {
    expect(isCurrentOrFutureDate("2026-09-29", today)).toBe(false);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCurrentOrFutureDate("tomorrow", today)).toBe(false);
  });
});
