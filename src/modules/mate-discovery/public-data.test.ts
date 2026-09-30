import { describe, expect, it } from "vitest";

import { buildMateSearchParams, isValidCalendarDate } from "./public-data";

describe("buildMateSearchParams", () => {
  it("keeps repeated lookup filters and the documented discovery fields", () => {
    const params = buildMateSearchParams(
      {
        q: "  coffee  ",
        activityId: ["2", "7", "7", "invalid"],
        interestId: "4",
        provinceId: "10",
        districtId: "18",
        availableDate: "2026-10-10",
        minRate: "100.50",
        maxRate: "500",
        minRating: "4.5",
        sort: "rate",
        page: "3",
      },
      "2026-09-24",
    );

    expect(params.getAll("activityId")).toEqual(["2", "7", "7"]);
    expect(params.getAll("interestId")).toEqual(["4"]);
    expect(params.get("q")).toBe("coffee");
    expect(params.get("provinceId")).toBe("10");
    expect(params.get("districtId")).toBe("18");
    expect(params.get("availableDate")).toBe("2026-10-10");
    expect(params.get("minRate")).toBe("100.50");
    expect(params.get("maxRate")).toBe("500");
    expect(params.get("minRating")).toBe("4.5");
    expect(params.get("sort")).toBe("rate");
    expect(params.get("page")).toBe("3");
    expect(params.get("limit")).toBe("12");
  });

  it("normalizes invalid filters and never sends a district without a province", () => {
    const params = buildMateSearchParams(
      {
        districtId: "9",
        minRate: "500",
        maxRate: "100",
        minRating: "9",
        activityId: ["0", "1.2", "4"],
        availableDate: "2026-09-23",
        sort: "newest",
        page: "-1",
      },
      "2026-09-24",
    );

    expect(params.has("districtId")).toBe(false);
    expect(params.has("minRate")).toBe(false);
    expect(params.has("maxRate")).toBe(false);
    expect(params.has("minRating")).toBe(false);
    expect(params.getAll("activityId")).toEqual(["4"]);
    expect(params.has("availableDate")).toBe(false);
    expect(params.get("sort")).toBe("-createdAt");
    expect(params.get("page")).toBe("1");
  });

  it("rejects impossible calendar dates while accepting leap days", () => {
    expect(isValidCalendarDate("2026-02-31")).toBe(false);
    expect(isValidCalendarDate("2024-02-29")).toBe(true);
    expect(
      buildMateSearchParams({ availableDate: "2026-02-31" }, "2026-01-01").has("availableDate"),
    ).toBe(false);
  });
});
