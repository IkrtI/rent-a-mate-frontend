import { describe, expect, it } from "vitest";

import { createSessionCookieOptions } from "./cookies";
import { withRefreshLock } from "./refresh";

describe("createSessionCookieOptions", () => {
  it("keeps session tokens inaccessible to browser JavaScript", () => {
    expect(createSessionCookieOptions(false)).toMatchObject({
      httpOnly: true,
      maxAge: 900,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  });

  it("requires secure cookies in production", () => {
    expect(createSessionCookieOptions(true)).toMatchObject({ secure: true });
  });

  it("shares concurrent refresh work for the same session", async () => {
    let calls = 0;
    const refresh = () => {
      calls += 1;
      return Promise.resolve({ accessToken: "next-access", refreshToken: "next-refresh" });
    };

    await expect(
      Promise.all([
        withRefreshLock("refresh-token", refresh),
        withRefreshLock("refresh-token", refresh),
      ]),
    ).resolves.toEqual([
      { accessToken: "next-access", refreshToken: "next-refresh" },
      { accessToken: "next-access", refreshToken: "next-refresh" },
    ]);
    expect(calls).toBe(1);
  });
});
