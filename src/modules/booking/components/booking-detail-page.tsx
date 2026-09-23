"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock3, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { getSession } from "@/modules/session/client";
import { getBooking, updateBooking } from "../client";
import { formatBookingDate, formatBookingTime, formatPrice } from "../format";
import { StatusBadge } from "./status-badge";

export function BookingDetailPage({ bookingId }: { bookingId: number }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const booking = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId),
  });
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const action = useMutation({
    mutationFn: (value: "accept" | "decline" | "cancel" | "complete") =>
      updateBooking(bookingId, value),
    onSuccess: async () => {
      setMessage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] }),
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "The booking could not be updated."),
  });

  if (booking.isPending) {
    return <p className="py-12 text-sm text-neutral-600">Loading booking...</p>;
  }
  if (booking.isError) {
    return <p className="py-12 text-sm text-red-600">This booking is unavailable.</p>;
  }

  const item = booking.data;
  const isMate = session.data?.user.role === "mate";
  const canRespond = isMate && item.status === "pending";
  const canCancel = item.status === "pending" || item.status === "confirmed";
  const canComplete = isMate && item.status === "confirmed";

  return (
    <main className="pb-24">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600"
        href="/bookings"
      >
        <ArrowLeft aria-hidden size={16} /> All bookings
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs text-[#e34b58] uppercase">Booking #{item.id}</p>
            <StatusBadge status={item.status} />
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-normal">
            {item.activity.name} with {isMate ? item.renter.name : item.mate.name}
          </h1>
          <div className="mt-8 grid gap-4 border-y border-neutral-200 py-6 sm:grid-cols-2">
            <div className="flex gap-3">
              <CalendarDays aria-hidden size={19} />
              <div>
                <p className="text-xs text-neutral-500">Date</p>
                <p className="mt-1 font-semibold">{formatBookingDate(item.date)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock3 aria-hidden size={19} />
              <div>
                <p className="text-xs text-neutral-500">Time</p>
                <p className="mt-1 font-semibold">
                  {formatBookingTime(item.startTime)}–{formatBookingTime(item.endTime)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-7">
            <h2 className="text-sm font-bold">People</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">Renter</dt>
                <dd className="mt-1 font-semibold">{item.renter.name}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Mate</dt>
                <dd className="mt-1 font-semibold">{item.mate.name}</dd>
              </div>
            </dl>
          </div>
          {item.status === "confirmed" || item.status === "completed" ? (
            <Link
              className="mt-8 inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-bold"
              href={`/messages/${item.id}`}
            >
              <MessageCircle aria-hidden size={17} /> Open conversation
            </Link>
          ) : null}
        </section>
        <aside className="h-fit rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-neutral-500">Total</p>
          <p className="mt-1 text-2xl font-bold">{formatPrice(item.totalPrice)}</p>
          <div className="mt-5 grid gap-2">
            {canRespond ? (
              <>
                <button
                  className="h-10 rounded-md bg-[#23212b] text-sm font-bold text-white"
                  disabled={action.isPending}
                  onClick={() => action.mutate("accept")}
                  type="button"
                >
                  Accept request
                </button>
                <button
                  className="h-10 rounded-md border border-neutral-300 text-sm font-bold"
                  disabled={action.isPending}
                  onClick={() => action.mutate("decline")}
                  type="button"
                >
                  Decline
                </button>
              </>
            ) : null}
            {canComplete ? (
              <button
                className="h-10 rounded-md bg-[#23212b] text-sm font-bold text-white"
                disabled={action.isPending}
                onClick={() => action.mutate("complete")}
                type="button"
              >
                Mark complete
              </button>
            ) : null}
            {canCancel ? (
              <button
                className="h-10 rounded-md border border-red-200 text-sm font-bold text-red-700"
                disabled={action.isPending}
                onClick={() => action.mutate("cancel")}
                type="button"
              >
                Cancel booking
              </button>
            ) : null}
          </div>
          {message ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {message}
            </p>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
