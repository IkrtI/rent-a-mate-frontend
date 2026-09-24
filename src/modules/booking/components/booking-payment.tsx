"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createPayment, getPayment } from "../client";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const statusCopy = {
  pending: "Payment is pending confirmation.",
  paid: "Payment successful.",
  failed: "Payment failed. Try again.",
  refunding: "Refund is processing.",
  refunded: "Payment has been refunded.",
} as const;

function CardForm({ onComplete }: { onComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="mt-4 grid gap-4 border-t border-neutral-200 pt-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setSubmitting(true);
        setError(null);
        const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
        setSubmitting(false);
        if (result.error) {
          setError(result.error.message ?? "Payment confirmation failed.");
          return;
        }
        onComplete();
      }}
    >
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        className="h-10 rounded-md bg-[#23212b] text-sm font-bold text-white disabled:opacity-50"
        disabled={!stripe || submitting}
        type="submit"
      >
        {submitting ? "Processing payment…" : "Confirm payment"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function BookingPayment({ bookingId, canPay }: { bookingId: number; canPay: boolean }) {
  const queryClient = useQueryClient();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const payment = useQuery({
    queryKey: ["payment", bookingId],
    queryFn: () => getPayment(bookingId),
    enabled: canPay,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" && query.state.data.providerReference ? 5_000 : false,
  });
  const initiate = useMutation({
    mutationFn: () => createPayment(bookingId),
    onSuccess: async (result) => {
      setClientSecret(result.clientSecret);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payment", bookingId] }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
      ]);
    },
  });

  if (!canPay) return null;
  const status = payment.data?.status;
  const hasIntent = Boolean(payment.data?.providerReference);
  const final = status === "paid" || status === "refunded" || status === "refunding";
  const error = initiate.error instanceof Error ? initiate.error.message : null;

  return (
    <section className="mt-5 border-t border-neutral-200 pt-5" aria-labelledby="payment-heading">
      <h2 className="font-bold" id="payment-heading">
        Payment
      </h2>
      {payment.isPending ? (
        <p className="mt-2 text-sm text-neutral-500">Loading payment status…</p>
      ) : null}
      {status ? (
        <p className={`mt-2 text-sm ${status === "failed" ? "text-red-600" : "text-neutral-600"}`}>
          {statusCopy[status]}
        </p>
      ) : null}
      {!final && !clientSecret ? (
        <button
          className="mt-4 h-10 w-full rounded-md bg-[#ff5c67] text-sm font-bold text-white disabled:opacity-50"
          disabled={initiate.isPending || payment.isPending}
          onClick={() => initiate.mutate()}
          type="button"
        >
          {initiate.isPending ? "Preparing payment…" : hasIntent ? "Continue payment" : "Pay now"}
        </button>
      ) : null}
      {clientSecret && stripePromise ? (
        <Elements
          options={{ clientSecret, appearance: { theme: "stripe" } }}
          stripe={stripePromise}
        >
          <CardForm
            onComplete={() => {
              void Promise.all([
                queryClient.invalidateQueries({ queryKey: ["payment", bookingId] }),
                queryClient.invalidateQueries({ queryKey: ["payments"] }),
                queryClient.invalidateQueries({ queryKey: ["notifications"] }),
              ]);
            }}
          />
        </Elements>
      ) : null}
      {clientSecret && !stripePromise ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          Payments are not configured. Contact support.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
