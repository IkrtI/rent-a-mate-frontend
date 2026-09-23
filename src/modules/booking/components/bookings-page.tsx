"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { getSession } from "@/modules/session/client";
import { listBookings } from "../client";
import { formatBookingDate, formatBookingTime, formatPrice } from "../format";
import { bookingStatusSchema, type BookingStatus } from "../schemas";
import { StatusBadge } from "./status-badge";

const filters: Array<{ label: string; value?: BookingStatus }> = [
  { label: "All" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsedStatus = bookingStatusSchema.safeParse(searchParams.get("status"));
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const query = useQuery({
    queryKey: ["bookings", { status, page }],
    queryFn: () => listBookings({ status, page }),
  });
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });

  const navigate = (next: { status?: BookingStatus; page?: number }) => {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if ((next.page ?? 1) > 1) params.set("page", String(next.page));
    router.push(`/bookings${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <main className="pb-24">
      <p className="font-mono text-[11px] tracking-[0.12em] text-[#e34b58] uppercase">Your plans</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bookings</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Track requests and confirmed plans in one place.
          </p>
        </div>
        <Link
          className="rounded-md bg-[#23212b] px-4 py-2.5 text-sm font-bold text-white"
          href="/mates"
        >
          Find a mate
        </Link>
      </div>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Booking status filter">
        {filters.map((filter) => (
          <button
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold ${
              filter.value === status
                ? "bg-[#23212b] text-white"
                : "border border-neutral-300 bg-white text-neutral-700"
            }`}
            key={filter.label}
            onClick={() => navigate({ status: filter.value })}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>
      {query.isPending ? (
        <p className="mt-10 text-sm text-neutral-600">Loading bookings...</p>
      ) : null}
      {query.isError ? (
        <p className="mt-10 text-sm text-red-600">Bookings could not be loaded.</p>
      ) : null}
      {query.data?.items.length === 0 ? (
        <div className="mt-10 border-y border-neutral-200 py-14 text-center">
          <CalendarDays className="mx-auto text-neutral-400" aria-hidden />
          <h2 className="mt-4 text-lg font-bold">No bookings here yet</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Try another status or discover someone new.
          </p>
        </div>
      ) : null}
      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {query.data?.items.map((booking) => (
          <Link
            className="grid gap-4 py-5 hover:bg-white/60 sm:grid-cols-[1fr_auto] sm:items-center sm:px-3"
            href={`/bookings/${booking.id}`}
            key={booking.id}
          >
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-bold">
                  {booking.activity.name} with{" "}
                  {session.data?.user.role === "mate" ? booking.renter.name : booking.mate.name}
                </h2>
                <StatusBadge status={booking.status} />
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {formatBookingDate(booking.date)} · {formatBookingTime(booking.startTime)}–
                {formatBookingTime(booking.endTime)}
              </p>
            </div>
            <p className="text-sm font-bold">{formatPrice(booking.totalPrice)}</p>
          </Link>
        ))}
      </div>
      {query.data && query.data.meta.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            aria-label="Previous page"
            className="grid size-9 place-items-center rounded-md border border-neutral-300 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => navigate({ status, page: page - 1 })}
            type="button"
          >
            <ChevronLeft aria-hidden size={18} />
          </button>
          <span className="text-sm">
            {page} / {query.data.meta.totalPages}
          </span>
          <button
            aria-label="Next page"
            className="grid size-9 place-items-center rounded-md border border-neutral-300 disabled:opacity-40"
            disabled={page >= query.data.meta.totalPages}
            onClick={() => navigate({ status, page: page + 1 })}
            type="button"
          >
            <ChevronRight aria-hidden size={18} />
          </button>
        </div>
      ) : null}
    </main>
  );
}
