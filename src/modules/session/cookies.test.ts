import { afterEach, describe, expect, it, vi } from "vitest";

import { createSessionCookieOptions, type CookieStore } from "./cookies";
import { refreshSession, withRefreshLock } from "./refresh";

describe("createSessionCookieOptions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
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

  it("writes rotated tokens to every concurrent response cookie store", async () => {
    process.env.BACKEND_URL = "http://localhost:3000/api/v1";
    process.env.SESSION_COOKIE_SECURE = "false";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: { accessToken: "next-access", refreshToken: "next-refresh" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const firstSet = vi.fn();
    const secondSet = vi.fn();
    const firstStore = { set: firstSet, delete: vi.fn() } as unknown as CookieStore;
    const secondStore = { set: secondSet, delete: vi.fn() } as unknown as CookieStore;

    await Promise.all([
      refreshSession(firstStore, "shared-refresh"),
      refreshSession(secondStore, "shared-refresh"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstSet).toHaveBeenCalledTimes(2);
    expect(secondSet).toHaveBeenCalledTimes(2);
  });
});
