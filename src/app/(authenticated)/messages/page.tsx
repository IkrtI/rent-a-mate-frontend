import type { Metadata } from "next";

import { MessagesPage } from "@/modules/messaging/components/messages-page";

export const metadata: Metadata = { title: "Messages | Rent a Mate" };

export default function Page() {
  return <MessagesPage />;
}
