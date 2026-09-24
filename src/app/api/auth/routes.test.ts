import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const values = new Map<string, string>();
  const store = {
    get: vi.fn((name: string) => {
      const value = values.get(name);
      return value === undefined ? undefined : { value };
    }),
    set: vi.fn((name: string, value: string, _options?: Record<string, unknown>) =>
      values.set(name, value),
    ),
    delete: vi.fn((name: string) => values.delete(name)),
  };
  return { values, store, cookies: vi.fn(async () => store), requestBackend: vi.fn() };
});

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/modules/backend-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/backend-client")>()),
  requestBackend: mocks.requestBackend,
}));

import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";
import { GET as session } from "./session/route";

const user = { id: 27, name: "Hosted QA", email: "qa@example.invalid", role: "renter" };
const accessToken = tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600);
const refreshToken = "test-refresh-token";

describe("BFF auth and session routes", () => {
  beforeEach(() => {
    mocks.values.clear();
    mocks.store.get.mockClear();
    mocks.store.set.mockClear();
    mocks.store.delete.mockClear();
    mocks.cookies.mockClear();
    mocks.requestBackend.mockReset();
    vi.stubEnv("BACKEND_URL", "https://api.example.invalid/api/v1");
    vi.stubEnv("SESSION_COOKIE_SECURE", "true");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("sets opaque HttpOnly session cookies at login and resolves the user through the backend", async () => {
    mocks.requestBackend.mockResolvedValueOnce({ accessToken, refreshToken, user });
    const loginResponse = await login(
      new Request("https://test-host.invalid/api/auth/login", {
        method: "POST",
        headers: {
          origin: "https://test-host.invalid",
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: user.email, password: "synthetic-test-password" }),
      }),
    );

    expect(loginResponse.status).toBe(200);
    const loginBody = await loginResponse.clone().json();
    expect(loginBody).toEqual({ user });
    expect(JSON.stringify(loginBody)).not.toContain(accessToken);
    expect(mocks.store.set).toHaveBeenCalledTimes(2);
    for (const [, , options] of mocks.store.set.mock.calls) {
      expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    }
    expect(mocks.values.size).toBe(2);

    mocks.requestBackend.mockResolvedValueOnce({ user });
    const sessionResponse = await session();
    expect(sessionResponse.status).toBe(200);
    expect(await sessionResponse.json()).toEqual({ user });
    expect(mocks.requestBackend).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: "/auth/me",
        session: { cookieStore: mocks.store, tokens: { accessToken, refreshToken } },
      }),
    );
  });

  it("returns an unauthenticated response when no session cookies exist", async () => {
    const response = await session();
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "SESSION_REQUIRED" } });
    expect(mocks.requestBackend).not.toHaveBeenCalled();
  });

  it("revokes the refresh token and clears both cookies on logout", async () => {
    mocks.values.set("ram_access", accessToken);
    mocks.values.set("ram_refresh", refreshToken);
    mocks.requestBackend.mockResolvedValueOnce(null);

    const response = await logout(
      new Request("https://test-host.invalid/api/auth/logout", {
        method: "POST",
        headers: { origin: "https://test-host.invalid" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.requestBackend).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/auth/logout", method: "POST", body: { refreshToken } }),
    );
    expect(mocks.store.delete).toHaveBeenCalledTimes(2);
    expect(mocks.values.size).toBe(0);
  });
});

function tokenWithExpiry(expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString("base64url");
  return `header.${payload}.signature`;
}
