"use client";

import { requestSameOrigin } from "@/modules/backend-client/browser";

import {
  bookingPageSchema,
  bookingSchema,
  createBookingInputSchema,
  createBookingResultSchema,
  type BookingStatus,
} from "./schemas";

export async function listBookings(input: { status?: BookingStatus; page?: number } = {}) {
  const query = new URLSearchParams({ limit: "10" });
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
