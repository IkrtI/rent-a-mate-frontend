import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingDetailPage } from "@/modules/booking/components/booking-detail-page";

export const metadata: Metadata = { title: "Booking details | Rent a Mate" };

export default async function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const bookingId = Number((await params).bookingId);
  if (!Number.isInteger(bookingId) || bookingId <= 0) notFound();
  return <BookingDetailPage bookingId={bookingId} />;
}
