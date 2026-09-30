import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MessagesPage } from "@/modules/messaging/components/messages-page";

export const metadata: Metadata = { title: "Conversation | Rent a Mate" };

export default async function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const bookingId = Number((await params).bookingId);
  if (!Number.isInteger(bookingId) || bookingId <= 0) notFound();
  return <MessagesPage selectedBookingId={bookingId} />;
}
