"use client";

import { requestSameOrigin } from "@/modules/backend-client/browser";

import {
  bookingPageSchema,
  bookingSchema,
  createPaymentSchema,
  createBookingInputSchema,
  createBookingResultSchema,
  paymentPageSchema,
  paymentSchema,
  reviewInputSchema,
  reviewSchema,
  type BookingStatus,
} from "./schemas";

export async function listBookings(
  input: { status?: BookingStatus; page?: number; limit?: number } = {},
) {
  const query = new URLSearchParams({ limit: String(input.limit ?? 10) });
  if (input.status) query.set("status", input.status);
  if (input.page) query.set("page", String(input.page));
  return requestSameOrigin(`/api/bookings?${query.toString()}`, bookingPageSchema);
}

export function getBooking(bookingId: number) {
  return requestSameOrigin(`/api/bookings/${bookingId}`, bookingSchema);
}

export function createBooking(input: unknown) {
  return requestSameOrigin("/api/bookings", createBookingResultSchema, {
    method: "POST",
    body: JSON.stringify(createBookingInputSchema.parse(input)),
  });
}

export function updateBooking(
  bookingId: number,
  action: "accept" | "decline" | "cancel" | "complete",
) {
  return requestSameOrigin(
    `/api/bookings/${bookingId}/${action}`,
    bookingSchema.partial().required({ id: true, status: true }),
    { method: "PATCH" },
  );
}

export function createReview(bookingId: number, input: unknown) {
  return requestSameOrigin(`/api/bookings/${bookingId}/review`, reviewSchema, {
    method: "POST",
    body: JSON.stringify(reviewInputSchema.parse(input)),
  });
}

export function updateReview(reviewId: number, input: unknown) {
  return requestSameOrigin(`/api/reviews/${reviewId}`, reviewSchema, {
    method: "PATCH",
    body: JSON.stringify(reviewInputSchema.parse(input)),
  });
}

export function deleteReview(reviewId: number) {
  return requestSameOrigin(`/api/reviews/${reviewId}`, reviewSchema.pick({ id: true }), {
    method: "DELETE",
  });
}

export function getPayment(bookingId: number) {
  return requestSameOrigin(`/api/bookings/${bookingId}/payment`, paymentSchema);
}

export function createPayment(bookingId: number) {
  return requestSameOrigin(`/api/bookings/${bookingId}/payment`, createPaymentSchema, {
    method: "POST",
  });
}

export function confirmLocalMockPayment(bookingId: number) {
  return requestSameOrigin(`/api/bookings/${bookingId}/payment/confirm`, paymentSchema, {
    method: "POST",
  });
}

export function listPayments(input: { page?: number; limit?: number } = {}) {
  const query = new URLSearchParams({ limit: String(input.limit ?? 20) });
  if (input.page) query.set("page", String(input.page));
  return requestSameOrigin(`/api/payments?${query}`, paymentPageSchema);
}
