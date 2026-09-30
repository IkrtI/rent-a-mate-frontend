import { describe, expect, it } from "vitest";

import { availableStarts } from "./time-selection";

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
