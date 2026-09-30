import type { Metadata } from "next";
import { Suspense } from "react";

import { BookingsPage } from "@/modules/booking/components/bookings-page";

export const metadata: Metadata = { title: "Bookings | Rent a Mate" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-600">Loading bookings...</p>}>
      <BookingsPage />
    </Suspense>
  );
}
