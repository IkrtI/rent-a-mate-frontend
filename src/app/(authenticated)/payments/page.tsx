import type { Metadata } from "next";

import { PaymentsPage } from "@/modules/booking/components/payments-page";

export const metadata: Metadata = { title: "Payment history | Rent a Mate" };

export default function Page() {
  return <PaymentsPage />;
}
