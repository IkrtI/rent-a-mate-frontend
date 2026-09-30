import { describe, expect, it } from "vitest";

import { shouldRefreshAccessToken } from "./server";

function unsignedToken(expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString("base64url");
  return `header.${payload}.signature`;
}

describe("shouldRefreshAccessToken", () => {
  it("refreshes malformed and nearly expired access tokens", () => {
    expect(shouldRefreshAccessToken("invalid", 1_000)).toBe(true);
    expect(shouldRefreshAccessToken(unsignedToken(1_020), 1_000)).toBe(true);
  });

  it("keeps an access token with sufficient lifetime", () => {
    expect(shouldRefreshAccessToken(unsignedToken(1_060), 1_000)).toBe(false);
  });
});
