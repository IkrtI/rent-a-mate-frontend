"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { listBookings } from "@/modules/booking/client";
import { formatBookingDate } from "@/modules/booking/format";
import { getSession } from "@/modules/session/client";
import { listMessages, sendMessage } from "../client";
import { useBookingRealtime } from "../realtime";
import type { Message, MessagePage } from "../schemas";

export function MessagesPage({ selectedBookingId }: { selectedBookingId?: number }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const bookings = useQuery({
    queryKey: ["bookings", "conversations"],
    queryFn: () => listBookings({ limit: 100 }),
  });
  const mergeMessage = (message: Message) => {
    queryClient.setQueryData<MessagePage>(["messages", selectedBookingId], (current) => {
      if (!current || current.items.some((item) => item.id === message.id)) return current;
      return {
        ...current,
        items: [...current.items, message],
        meta: { ...current.meta, total: current.meta.total + 1 },
      };
    });
  };
  const realtime = useBookingRealtime(
    selectedBookingId,
    (message) => {
      mergeMessage(message);
      void queryClient.invalidateQueries({ queryKey: ["messages", selectedBookingId] });
    },
    () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", selectedBookingId] });
    },
  );
  const messages = useQuery({
    queryKey: ["messages", selectedBookingId],
    queryFn: () => listMessages(selectedBookingId!),
    enabled: selectedBookingId !== undefined,
    refetchInterval: realtime.status === "connected" ? false : 10_000,
  });
  const send = useMutation({
    mutationFn: () => sendMessage(selectedBookingId!, content),
    onSuccess: async (message) => {
      mergeMessage(message);
      setContent("");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (sendError) => {
      setError(sendError instanceof Error ? sendError.message : "The message could not be sent.");
    },
  });

  const conversations =
    bookings.data?.items.filter(
      (booking) => booking.status === "confirmed" || booking.status === "completed",
    ) ?? [];
  const selected = conversations.find((booking) => booking.id === selectedBookingId);
  const user = session.data?.user;

  return (
    <main className="pb-24">
      <p className="font-mono text-[11px] tracking-[0.12em] text-[#e34b58] uppercase">
        Stay connected
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Messages</h1>
      <div className="mt-7 grid min-h-[620px] overflow-hidden rounded-md border border-neutral-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`${selectedBookingId ? "hidden lg:block" : "block"} border-r border-neutral-200`}
          aria-label="Conversations"
        >
          <div className="border-b border-neutral-200 px-4 py-4 text-sm font-bold">
            Conversations
          </div>
          {bookings.isPending ? <p className="p-4 text-sm text-neutral-500">Loading...</p> : null}
          {conversations.length === 0 && !bookings.isPending ? (
            <p className="p-5 text-sm leading-6 text-neutral-500">
              Conversations become available after a booking is confirmed.
            </p>
          ) : null}
          {conversations.map((booking) => {
            const other = user?.role === "mate" ? booking.renter : booking.mate;
            return (
              <Link
                className={`block border-b border-neutral-100 px-4 py-4 hover:bg-neutral-50 ${
                  selectedBookingId === booking.id ? "bg-[#fff3f2]" : ""
                }`}
                href={`/messages/${booking.id}`}
                key={booking.id}
              >
                <span className="block text-sm font-bold">{other.name}</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {booking.activity.name} · {formatBookingDate(booking.date)}
                </span>
              </Link>
            );
          })}
        </aside>
        {selectedBookingId ? (
          <section className="flex min-h-[620px] flex-col">
            <div className="border-b border-neutral-200 px-5 py-4">
              <Link
                className="mb-2 inline-block text-xs font-semibold text-[#d74653] lg:hidden"
                href="/messages"
              >
                Back to conversations
              </Link>
              <h2 className="font-bold">
                {selected
                  ? user?.role === "mate"
                    ? selected.renter.name
                    : selected.mate.name
                  : "Conversation"}
              </h2>
              {selected ? (
                <p className="mt-1 text-xs text-neutral-500">{selected.activity.name}</p>
              ) : null}
              <p className="mt-2 text-xs text-neutral-500" role="status">
                {realtime.status === "connected"
                  ? "Live updates connected"
                  : realtime.status === "connecting"
                    ? "Connecting live updates…"
                    : "Live updates unavailable — using refresh fallback"}
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto bg-[#fffdfc] p-5">
              {messages.isPending ? (
                <p className="text-sm text-neutral-500">Loading messages...</p>
              ) : null}
              {messages.isError ? (
                <p className="text-sm text-red-600">This conversation is unavailable.</p>
              ) : null}
              {messages.data?.items.length === 0 ? (
                <div className="my-auto text-center">
                  <MessageCircle className="mx-auto text-neutral-300" aria-hidden size={32} />
                  <p className="mt-3 text-sm text-neutral-500">Start the conversation.</p>
                </div>
              ) : null}
              {messages.data?.items.map((message) => {
                const mine = message.senderId === user?.id;
                return (
                  <div
                    className={`max-w-[82%] rounded-md px-3 py-2 text-sm leading-6 ${
                      mine
                        ? "ml-auto bg-[#23212b] text-white"
                        : "mr-auto bg-neutral-100 text-neutral-900"
                    }`}
                    key={message.id}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-neutral-400"}`}
                    >
                      {new Intl.DateTimeFormat("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Bangkok",
                      }).format(new Date(message.createdAt))}
                    </p>
                  </div>
                );
              })}
            </div>
            <form
              className="border-t border-neutral-200 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (content.trim()) send.mutate();
              }}
            >
              <div className="flex items-end gap-2 rounded-md bg-neutral-100 p-2">
                <label className="sr-only" htmlFor="message-content">
                  Message
                </label>
                <textarea
                  className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
                  id="message-content"
                  maxLength={2000}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write a message..."
                  rows={1}
                  value={content}
                />
                <button
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ff5c67] text-white disabled:opacity-50"
                  disabled={!content.trim() || send.isPending}
                  title="Send message"
                  type="submit"
                >
                  <Send aria-hidden size={17} />
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-xs text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </section>
        ) : (
          <section className="hidden place-items-center text-center lg:grid">
            <div>
              <MessageCircle className="mx-auto text-neutral-300" aria-hidden size={36} />
              <h2 className="mt-4 font-bold">Choose a conversation</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Messages stay connected to each booking.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
