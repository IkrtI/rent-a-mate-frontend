"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { createSocketTicket } from "./client";
import type { Message } from "./schemas";

type RealtimeStatus = "connecting" | "connected" | "unavailable";

type ChatAck = { ok: true } | { ok: false; error: string };
type TypingBroadcast = { bookingId: number; userId: number; isTyping: boolean };
type MessagesReadBroadcast = { bookingId: number; readerId: number; updatedCount: number };

/**
 * Opens one booking room. Every connection (including a reconnect) obtains a
 * new ticket because the server consumes tickets before accepting a socket.
 */
export function useBookingRealtime(
  bookingId: number | undefined,
  onMessage: (message: Message) => void,
  onJoined: () => void,
  onMessagesRead: (event: MessagesReadBroadcast) => void,
) {
  const [status, setStatus] = useState<RealtimeStatus>("unavailable");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingExpiryRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onMessageRef = useRef(onMessage);
  const onJoinedRef = useRef(onJoined);
  const onMessagesReadRef = useRef(onMessagesRead);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  useEffect(() => {
    onMessageRef.current = onMessage;
    onJoinedRef.current = onJoined;
    onMessagesReadRef.current = onMessagesRead;
  }, [onJoined, onMessage, onMessagesRead]);

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
        socket.on("typing", (event: TypingBroadcast) => {
          if (event.bookingId !== bookingId) return;
          if (typingExpiryRef.current) clearTimeout(typingExpiryRef.current);
          setIsOtherTyping(event.isTyping);
          if (event.isTyping) {
            typingExpiryRef.current = setTimeout(() => setIsOtherTyping(false), 3_000);
          }
        });
        socket.on("messages_read", (event: MessagesReadBroadcast) => {
          if (event.bookingId === bookingId) onMessagesReadRef.current(event);
        });
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
          setIsOtherTyping(false);
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
      if (typingExpiryRef.current) clearTimeout(typingExpiryRef.current);
      if (activeSocket?.connected) {
        activeSocket.emit("typing", { bookingId, isTyping: false });
      }
      activeSocket?.emit("leave_booking", { bookingId });
      activeSocket?.disconnect();
      if (socketRef.current === activeSocket) socketRef.current = null;
    };
  }, [bookingId, socketUrl]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!bookingId || !socketRef.current?.connected) return;
      socketRef.current.emit("typing", { bookingId, isTyping }, () => undefined);
    },
    [bookingId],
  );

  const markRead = useCallback(() => {
    if (!bookingId || !socketRef.current?.connected) return;
    socketRef.current.emit("mark_read", { bookingId }, () => undefined);
  }, [bookingId]);

  return { status, isOtherTyping, setTyping, markRead };
}
