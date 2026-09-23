import { describe, expect, it } from "vitest";

import { safeReturnTo } from "./navigation";

describe("safeReturnTo", () => {
  it("keeps internal paths and rejects external redirects", () => {
    expect(safeReturnTo("/bookings/12")).toBe("/bookings/12");
    expect(safeReturnTo("https://evil.example")).toBe("/dashboard");
    expect(safeReturnTo("//evil.example")).toBe("/dashboard");
  });
});
