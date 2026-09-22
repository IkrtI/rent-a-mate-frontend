import { describe, expect, it } from "vitest";

import { canRetryAfterRefresh } from "./client";

describe("canRetryAfterRefresh", () => {
  it("only permits a safe GET retry", () => {
    expect(canRetryAfterRefresh()).toBe(true);
    expect(canRetryAfterRefresh("POST")).toBe(false);
    expect(canRetryAfterRefresh("PATCH")).toBe(false);
  });
});
