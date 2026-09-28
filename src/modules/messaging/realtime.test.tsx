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

function createSocket(joinAck: { ok: boolean; error?: string } = { ok: true }) {
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
        if (event === "join_booking") acknowledgement?.(joinAck as never);
        return socket;
      },
    ),
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
    mocks.createSocketTicket.mockReset();
    mocks.createSocketTicket.mockResolvedValue({ ticket: "one-time-ticket" });
    mocks.io.mockReset();
  });

  it("stops retrying when the booking room rejects the user", async () => {
    vi.useFakeTimers();
    const { socket } = createSocket({ ok: false, error: "Booking not found" });
    mocks.io.mockReturnValue(socket);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const { result, unmount } = renderHook(() =>
        useBookingRealtime(42, vi.fn(), vi.fn(), vi.fn()),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.status).toBe("unavailable");
      expect(socket.disconnect).toHaveBeenCalledOnce();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(mocks.createSocketTicket).toHaveBeenCalledTimes(1);
      unmount();
    } finally {
      warning.mockRestore();
      vi.useRealTimers();
    }
  });

  it("stops retrying when the socket ticket is rejected", async () => {
    vi.useFakeTimers();
    const { handlers, socket } = createSocket();
    socket.connect.mockImplementationOnce(() => {
      handlers.get("connect_error")?.(
        Object.assign(new Error("Invalid socket ticket"), {
          data: { code: "SOCKET_AUTH_REJECTED" },
        }),
      );
    });
    mocks.io.mockReturnValue(socket);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const { result, unmount } = renderHook(() =>
        useBookingRealtime(42, vi.fn(), vi.fn(), vi.fn()),
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.status).toBe("unavailable");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(mocks.createSocketTicket).toHaveBeenCalledTimes(1);
      unmount();
    } finally {
      warning.mockRestore();
      vi.useRealTimers();
    }
  });

  it("exposes typing and read events after joining the booking room", async () => {
    const { handlers, socket } = createSocket();
    const onMessage = vi.fn();
    const onMessagesRead = vi.fn();
    mocks.io.mockReturnValue(socket);

    const { result, unmount } = renderHook(() =>
      useBookingRealtime(42, onMessage, vi.fn(), onMessagesRead),
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
    const message = { id: 55, bookingId: 42, senderId: 3, content: "hello" };
    act(() => handlers.get("new_message")?.(message));
    expect(onMessage).toHaveBeenCalledWith(message);
    expect(socket.emit).not.toHaveBeenCalledWith(
      "send_message",
      expect.anything(),
      expect.anything(),
    );

    unmount();
    expect(socket.emit).toHaveBeenCalledWith("typing", { bookingId: 42, isTyping: false });
    expect(socket.emit).toHaveBeenCalledWith("leave_booking", { bookingId: 42 });
  });
});
