"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { createSocketTicket } from "./client";
import type { Message } from "./schemas";

type RealtimeStatus = "connecting" | "connected" | "unavailable";

type ChatAck = { ok: true } | { ok: false; error: string };

/**
 * Opens one booking room. Every connection (including a reconnect) obtains a
 * new ticket because the server consumes tickets before accepting a socket.
 */
export function useBookingRealtime(
  bookingId: number | undefined,
  onMessage: (message: Message) => void,
  onJoined: () => void,
) {
  const [status, setStatus] = useState<RealtimeStatus>("unavailable");
  const onMessageRef = useRef(onMessage);
  const onJoinedRef = useRef(onJoined);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  useEffect(() => {
    onMessageRef.current = onMessage;
    onJoinedRef.current = onJoined;
  }, [onJoined, onMessage]);

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
        socket.on("new_message", (message: Message) => onMessageRef.current(message));
        socket.on("connect", () => {
          socket.emit("join_booking", { bookingId }, (ack: ChatAck) => {
            if (ack.ok) {
              setStatus("connected");
              onJoinedRef.current();
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
    };
  }, [bookingId, socketUrl]);

  return { status };
}
