"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import Link from "next/link";

import { getSession } from "@/modules/session/client";

import { listBookings } from "../client";
import { formatBookingDate, formatBookingTime } from "../format";

const summaryCards = [
  { key: "pending", label: "Awaiting response", icon: Clock3 },
  { key: "confirmed", label: "Confirmed plans", icon: CalendarDays },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

export function DashboardPage() {
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const bookings = useQuery({
    queryKey: ["bookings", "dashboard"],
    queryFn: () => listBookings({ limit: 100 }),
  });
  const user = session.data?.user;
  const items = bookings.data?.items ?? [];
  const upcoming = items
    .filter((booking) => booking.status === "pending" || booking.status === "confirmed")
    .sort((a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime())
    .slice(0, 4);

  return (
    <main className="pb-24">
      <p className="font-mono text-[11px] tracking-[0.12em] text-[#e34b58] uppercase">
        Your account
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Good morning{user ? `, ${user.name.split(" ")[0]}` : ""}.
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            {user?.role === "mate"
              ? "Keep track of incoming requests and plans you are hosting."
              : "Your upcoming plans and booking updates, all in one place."}
          </p>
        </div>
        <Link
          className="bg-foreground text-background rounded-md px-4 py-2.5 text-sm font-bold"
          href="/bookings"
        >
          View all bookings
        </Link>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Booking summary">
        {summaryCards.map(({ key, label, icon: Icon }) => (
          <div
            className="border-border bg-card text-card-foreground rounded-md border p-5"
            key={key}
          >
            <Icon aria-hidden className="text-muted-foreground" size={19} />
            <p className="mt-7 text-3xl font-bold">
              {bookings.isPending ? "—" : items.filter((booking) => booking.status === key).length}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Upcoming bookings</h2>
          <Link
            className="text-sm font-bold text-[#d74653] hover:underline"
            href="/bookings?status=confirmed"
          >
            See bookings
          </Link>
        </div>
        {bookings.isPending ? (
          <p className="text-muted-foreground mt-4 text-sm">Loading your plans...</p>
        ) : null}
        {bookings.isError ? (
          <p className="text-destructive mt-4 flex items-center gap-2 text-sm" role="alert">
            <XCircle aria-hidden size={16} /> Your bookings could not be loaded. Try again shortly.
          </p>
        ) : null}
        {!bookings.isPending && !bookings.isError && upcoming.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground mt-4 rounded-md border border-dashed px-5 py-8 text-sm">
            No upcoming bookings yet.{" "}
            {user?.role === "renter"
              ? "Find a mate when you are ready."
              : "New requests will appear here."}
          </div>
        ) : null}
        <div className="mt-4 grid gap-3">
          {upcoming.map((booking) => {
            const other = user?.role === "mate" ? booking.renter : booking.mate;
            return (
              <Link
                className="border-border bg-card text-card-foreground hover:border-primary flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border px-5 py-4 shadow-sm transition-colors"
                href={`/bookings/${booking.id}`}
                key={booking.id}
              >
                <span className="min-w-44 font-semibold">
                  {booking.activity.name} with {other.name}
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatBookingDate(booking.date)}
                </span>
                <span className="text-muted-foreground text-sm">
                  {formatBookingTime(booking.startTime)}–{formatBookingTime(booking.endTime)}
                </span>
                <span className="ml-auto text-xs font-bold text-[#d74653] uppercase">
                  {booking.status}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
