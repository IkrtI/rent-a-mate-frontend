import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBookingRealtime } from "./realtime";

const mocks = vi.hoisted(() => ({
  createSocketTicket: vi.fn(),
  io: vi.fn(),
}));

vi.mock("./client", () => ({ createSocketTicket: mocks.createSocketTicket }));
vi.mock("socket.io-client", () => ({ io: mocks.io }));

type Handler = (payload?: unknown) => void;

function createSocket() {
  const handlers = new Map<string, Handler>();
  const socket = {
    connected: false,
    connect: vi.fn(() => {
      socket.connected = true;
      handlers.get("connect")?.();
    }),
    disconnect: vi.fn(() => {
      socket.connected = false;
    }),
    emit: vi.fn(
      (event: string, _payload: unknown, acknowledgement?: (...args: never[]) => void) => {
        if (event === "join_booking") acknowledgement?.({ ok: true } as never);
        if (event === "send_message") {
          acknowledgement?.(
            null as never,
            {
              ok: true,
              data: { id: 55, senderId: 3, content: "hello", createdAt: "2026-09-25T00:00:00Z" },
            } as never,
          );
        }
        return socket;
      },
    ),
    timeout: vi.fn(() => socket),
    on: vi.fn((event: string, handler: Handler) => {
      handlers.set(event, handler);
      return socket;
    }),
  };
  return { handlers, socket };
}

describe("useBookingRealtime", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SOCKET_URL = "http://socket.test";
    mocks.createSocketTicket.mockResolvedValue({ ticket: "one-time-ticket" });
    mocks.io.mockReset();
  });

  it("exposes typing and read events after joining the booking room", async () => {
    const { handlers, socket } = createSocket();
    const onMessagesRead = vi.fn();
    mocks.io.mockReturnValue(socket);

    const { result, unmount } = renderHook(() =>
      useBookingRealtime(42, vi.fn(), vi.fn(), onMessagesRead),
    );

    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(socket.emit).toHaveBeenCalledWith(
      "join_booking",
      { bookingId: 42 },
      expect.any(Function),
    );

    act(() => handlers.get("typing")?.({ bookingId: 42, userId: 11, isTyping: true }));
    expect(result.current.isOtherTyping).toBe(true);

    act(() => {
      result.current.setTyping(true);
      result.current.markRead();
      handlers.get("messages_read")?.({ bookingId: 42, readerId: 11, updatedCount: 2 });
    });
    expect(socket.emit).toHaveBeenCalledWith(
      "typing",
      { bookingId: 42, isTyping: true },
      expect.any(Function),
    );
    expect(socket.emit).toHaveBeenCalledWith("mark_read", { bookingId: 42 }, expect.any(Function));
    expect(onMessagesRead).toHaveBeenCalledWith({
      bookingId: 42,
      readerId: 11,
      updatedCount: 2,
    });

    await act(async () => {
      await expect(result.current.sendMessage("hello")).resolves.toMatchObject({
        id: 55,
        content: "hello",
      });
    });
    expect(socket.emit).toHaveBeenCalledWith(
      "send_message",
      { bookingId: 42, content: "hello" },
      expect.any(Function),
    );

    unmount();
    expect(socket.emit).toHaveBeenCalledWith("typing", { bookingId: 42, isTyping: false });
    expect(socket.emit).toHaveBeenCalledWith("leave_booking", { bookingId: 42 });
  });
});
