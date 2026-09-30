import { describe, expect, it } from "vitest";

import { sendMessageSchema } from "./schemas";

describe("sendMessageSchema", () => {
  const clientMessageId = "fd3b5666-9e9d-49d9-a843-098bebf786db";

  it("trims a message and rejects empty content", () => {
    expect(sendMessageSchema.parse({ clientMessageId, content: "  hello  " })).toEqual({
      clientMessageId,
      content: "hello",
    });
    expect(() => sendMessageSchema.parse({ clientMessageId, content: "   " })).toThrow();
    expect(() => sendMessageSchema.parse({ content: "hello" })).toThrow();
  });
});
