"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { listPayments } from "../client";
import { formatPrice } from "../format";

export function PaymentsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: () => listPayments({ limit: 100 }),
  });
  const paymentHistory = (
    <>
      {payments.isPending ? (
        <p className="mt-8 text-sm text-neutral-500">Loading payments…</p>
      ) : null}
      {payments.isError ? (
        <p className="mt-8 text-sm text-red-600" role="alert">
          Payment history is unavailable.
        </p>
      ) : null}
      {payments.data?.items.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No payments yet.</p>
      ) : null}
      {payments.data?.items.length ? (
        <div className="mt-7 overflow-hidden rounded-md border border-neutral-200 bg-white">
          {payments.data.items.map((payment) => (
            <Link
              className="flex items-center justify-between gap-4 border-b border-neutral-100 p-4 last:border-0 hover:bg-neutral-50"
              href={`/bookings/${payment.bookingId}`}
              key={payment.bookingId}
            >
              <span>
                <span className="block text-sm font-bold">Booking #{payment.bookingId}</span>
                <span className="mt-1 block text-xs text-neutral-500">{payment.status}</span>
              </span>
              <span className="text-sm font-bold">{formatPrice(payment.amount)}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <section className="mt-8" aria-labelledby="embedded-payment-history-title">
        <h2 className="text-lg font-bold" id="embedded-payment-history-title">
          Payment history
        </h2>
        {paymentHistory}
      </section>
    );
  }

  return (
    <main className="pb-24">
      <p className="font-mono text-[11px] tracking-[0.12em] text-[#b43740] uppercase">
        Your account
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Payment history</h1>
      <Link
        className="mt-3 inline-block text-sm font-semibold text-[#b43740]"
        href="/bookings?view=payments"
      >
        Open in bookings
      </Link>
      {paymentHistory}
    </main>
  );
}
