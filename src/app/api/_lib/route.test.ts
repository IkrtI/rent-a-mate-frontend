import { describe, expect, it } from "vitest";

import { assertSameOrigin, RouteError } from "./route";

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
