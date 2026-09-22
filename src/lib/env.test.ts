import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("accepts a valid server configuration", () => {
    expect(
      parseServerEnv({
        BACKEND_URL: "https://api.example.test/api/v1",
        SESSION_COOKIE_SECURE: "false",
        NODE_ENV: "test",
      }),
    ).toEqual({
      backendApiUrl: "https://api.example.test/api/v1",
      isCookieSecure: false,
    });
  });

  it("rejects a relative backend URL", () => {
    expect(() =>
      parseServerEnv({
        BACKEND_URL: "/api/v1",
        SESSION_COOKIE_SECURE: "false",
        NODE_ENV: "test",
      }),
    ).toThrow("BACKEND_URL");
  });

  it("requires secure cookies in production", () => {
    expect(() =>
      parseServerEnv({
        BACKEND_URL: "https://api.example.test/api/v1",
        SESSION_COOKIE_SECURE: "false",
        NODE_ENV: "production",
      }),
    ).toThrow("SESSION_COOKIE_SECURE");
  });

  it("keeps public variables in a separate schema", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_APP_URL: "https://app.example.test/" })).toEqual({
      appUrl: "https://app.example.test",
    });
  });
});
