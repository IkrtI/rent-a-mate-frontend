import { describe, expect, it, vi } from "vitest";

import { RealtimeSendError, sendSocketMessage } from "./realtime";

type TestSocket = {
  connected: boolean;
  emit: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
};

function socketWith(
  emit: (
    event: string,
    payload: unknown,
    ack: (result: { ok: true } | { ok: false; error: string }) => void,
  ) => void,
  connected = true,
) {
  return {
    connected,
    emit: vi.fn(emit),
    off: vi.fn(),
    once: vi.fn(),
  } as TestSocket;
}

describe("sendSocketMessage", () => {
  it("allows a REST fallback only before an emit is attempted", async () => {
    await expect(
      sendSocketMessage(socketWith(() => undefined, false) as never, 1, "Hello"),
    ).rejects.toMatchObject({
      canFallBackToRest: true,
    });
  });

  it("resolves from an acknowledgement and clears its disconnect listener", async () => {
    const socket = socketWith((_event, _payload, ack) => ack({ ok: true }));

    await expect(sendSocketMessage(socket as never, 1, "Hello")).resolves.toBeUndefined();
    expect(socket.off).toHaveBeenCalledWith("disconnect", expect.any(Function));
  });

  it("does not allow a REST fallback after an acknowledgement error", async () => {
    const socket = socketWith((_event, _payload, ack) =>
      ack({ ok: false, error: "MESSAGE_NOT_ALLOWED" }),
    );

    await expect(sendSocketMessage(socket as never, 1, "Hello")).rejects.toMatchObject({
      canFallBackToRest: false,
      message: "MESSAGE_NOT_ALLOWED",
    } satisfies Partial<RealtimeSendError>);
  });

  it("does not allow a REST fallback when the acknowledgement times out", async () => {
    vi.useFakeTimers();
    try {
      const socket = socketWith(() => undefined);
      const pending = sendSocketMessage(socket as never, 1, "Hello");
      const rejection = expect(pending).rejects.toMatchObject({ canFallBackToRest: false });
      await vi.advanceTimersByTimeAsync(3_000);

      await rejection;
      expect(socket.off).toHaveBeenCalledWith("disconnect", expect.any(Function));
    } finally {
      vi.useRealTimers();
    }
  });
});
