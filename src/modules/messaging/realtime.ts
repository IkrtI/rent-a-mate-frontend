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
type ChatSocket = Pick<Socket, "connected" | "emit" | "off" | "once">;

export function sendSocketMessage(socket: ChatSocket | null, bookingId: number, content: string) {
  return new Promise<void>((resolve, reject) => {
    if (!socket?.connected) {
      reject(new RealtimeSendError("Live connection unavailable.", true));
      return;
    }
    let settled = false;
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.off("disconnect", handleDisconnect);
      callback();
    };
    const handleDisconnect = () => {
      // `emit` was already attempted, so a REST retry could duplicate a
      // persisted message if the server received it before disconnecting.
      settle(() => reject(new RealtimeSendError("Live connection closed.", false)));
    };
    const timeout = setTimeout(() => {
      // The server may have persisted the message before its ACK was lost.
      // Reconcile via query invalidation; never create it again.
      settle(() => reject(new RealtimeSendError("Live message acknowledgement timed out.", false)));
    }, 3_000);
    socket.once("disconnect", handleDisconnect);
    try {
      socket.emit("send_message", { bookingId, content }, (ack: ChatAck) => {
        settle(() => {
          if (ack.ok) resolve();
          else reject(new RealtimeSendError(ack.error, false));
        });
      });
    } catch {
      settle(() => reject(new RealtimeSendError("Live message could not be sent.", false)));
    }
  });
}

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
      if (stopped || reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        void connect();
      }, 1_500);
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
      !bookingId || status !== "connected"
        ? Promise.reject(new RealtimeSendError("Live connection unavailable.", true))
        : sendSocketMessage(socketRef.current, bookingId, content),
    [bookingId, status],
  );

  return { status, send };
}
