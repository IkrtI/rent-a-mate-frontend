import { describe, expect, it } from "vitest";

import { sendMessageSchema } from "./schemas";

describe("sendMessageSchema", () => {
  it("trims a message and rejects empty content", () => {
    const clientMessageId = "fd3b5666-9e9d-49d9-a843-098bebf786db";
    expect(sendMessageSchema.parse({ clientMessageId, content: "  hello  " })).toEqual({
      clientMessageId,
      content: "hello",
    });
    expect(() => sendMessageSchema.parse({ clientMessageId, content: "   " })).toThrow();
  });
});
