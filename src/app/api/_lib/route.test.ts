import { describe, expect, it } from "vitest";

import { assertSameOrigin, RouteError } from "./route";
import { SessionRefreshError } from "@/modules/session/refresh";
import { routeErrorResponse } from "./route";

describe("assertSameOrigin", () => {
  it("accepts same-origin and rejects cross-origin mutations", () => {
    expect(() =>
      assertSameOrigin(
        new Request("https://app.example.test/api/auth/login", {
          headers: { origin: "https://app.example.test" },
        }),
      ),
    ).not.toThrow();

    expect(() =>
      assertSameOrigin(
        new Request("https://app.example.test/api/auth/login", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toThrow(RouteError);
  });
});

describe("routeErrorResponse", () => {
  it("maps a rejected refresh token to SESSION_EXPIRED", async () => {
    const response = routeErrorResponse(new SessionRefreshError(401, "Refresh rejected."));

    await expect(response.json()).resolves.toEqual({
      error: {
        status: 401,
        code: "SESSION_EXPIRED",
        message: "Your session has expired. Please sign in again.",
        retryable: false,
      },
    });
    expect(response.status).toBe(401);
  });

  it("keeps a temporary refresh failure retryable", async () => {
    const response = routeErrorResponse(new SessionRefreshError(503, "Refresh unavailable."));

    await expect(response.json()).resolves.toMatchObject({
      error: { status: 503, code: "SESSION_REFRESH_UNAVAILABLE", retryable: true },
    });
    expect(response.status).toBe(503);
  });
});
