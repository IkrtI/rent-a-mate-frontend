import { describe, expect, it } from "vitest";

import { sendMessageSchema } from "./schemas";

describe("sendMessageSchema", () => {
  it("trims a message and rejects empty content", () => {
    expect(sendMessageSchema.parse({ content: "  hello  " })).toEqual({ content: "hello" });
    expect(() => sendMessageSchema.parse({ content: "   " })).toThrow();
  });
});
