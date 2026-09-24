"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { createSocketTicket } from "./client";
import type { Message } from "./schemas";

type RealtimeStatus = "connecting" | "connected" | "unavailable";

export class RealtimeSendError extends Error {
  constructor(
    message: string,
    readonly canFallBackToRest: boolean,
  ) {
    super(message);
  }
}

type ChatAck = { ok: true } | { ok: false; error: string };

/**
 * Opens one booking room. Every connection (including a reconnect) obtains a
 * new ticket because the server consumes tickets before accepting a socket.
 */
export function useBookingRealtime(
  bookingId: number | undefined,
  onMessage: (message: Message) => void,
) {
  const [status, setStatus] = useState<RealtimeStatus>("unavailable");
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!bookingId || !socketUrl) {
      return;
    }

    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let activeSocket: Socket | null = null;
    const scheduleReconnect = () => {
      if (!stopped) reconnectTimer = setTimeout(() => void connect(), 1_500);
    };
    const connect = async () => {
      try {
        setStatus("connecting");
        const { ticket } = await createSocketTicket();
        if (stopped) return;
        const socket = io(`${socketUrl.replace(/\/$/, "")}/chat`, {
          auth: { ticket },
          autoConnect: false,
          reconnection: false,
          transports: ["websocket"],
        });
        activeSocket = socket;
        socketRef.current = socket;
        socket.on("new_message", (message: Message) => onMessageRef.current(message));
        socket.on("connect", () => {
          socket.emit("join_booking", { bookingId }, (ack: ChatAck) => {
            if (ack.ok) {
              setStatus("connected");
              return;
            }
            setStatus("unavailable");
            socket.disconnect();
            scheduleReconnect();
          });
        });
        socket.on("connect_error", () => {
          setStatus("unavailable");
          scheduleReconnect();
        });
        socket.on("disconnect", () => {
          setStatus("unavailable");
          scheduleReconnect();
        });
        socket.connect();
      } catch {
        setStatus("unavailable");
        scheduleReconnect();
      }
    };
    void connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      activeSocket?.emit("leave_booking", { bookingId });
      activeSocket?.disconnect();
      if (socketRef.current === activeSocket) socketRef.current = null;
    };
  }, [bookingId, socketUrl]);

  const send = useCallback(
    (content: string) =>
      new Promise<void>((resolve, reject) => {
        const socket = socketRef.current;
        if (!bookingId || status !== "connected" || !socket?.connected) {
          reject(new RealtimeSendError("Live connection unavailable.", true));
          return;
        }
        const timeout = setTimeout(
          () => reject(new RealtimeSendError("Live message acknowledgement timed out.", true)),
          3_000,
        );
        socket.emit("send_message", { bookingId, content }, (ack: ChatAck) => {
          clearTimeout(timeout);
          if (ack.ok) resolve();
          else reject(new RealtimeSendError(ack.error, false));
        });
      }),
    [bookingId, status],
  );

  return { status, send };
}
