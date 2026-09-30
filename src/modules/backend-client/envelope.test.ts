import { describe, expect, it } from "vitest";

import { normalizeBackendError, unwrapEnvelope } from "./envelope";

describe("unwrapEnvelope", () => {
  it("returns payload data from the backend success envelope", () => {
    expect(unwrapEnvelope({ status: "success", data: { id: 7 }, message: "OK" })).toEqual({
      id: 7,
    });
  });

  it("rejects a malformed success envelope", () => {
    expect(() => unwrapEnvelope({ status: "success", message: "OK" })).toThrow("data");
  });
});

describe("normalizeBackendError", () => {
  it("maps validation messages into field errors", () => {
    expect(
      normalizeBackendError(400, {
        message: ["email must be an email", "password is too short"],
      }),
    ).toEqual({
      status: 400,
      code: "BAD_REQUEST",
      message: "email must be an email",
      fieldErrors: {
        email: ["email must be an email"],
        password: ["password is too short"],
      },
      retryable: false,
    });
  });
});
