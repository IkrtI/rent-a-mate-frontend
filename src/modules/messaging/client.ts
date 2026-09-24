"use client";

import { z } from "zod";

import { requestSameOrigin } from "@/modules/backend-client/browser";
import { messagePageSchema, messageSchema, sendMessageSchema } from "./schemas";

const socketTicketSchema = z.object({ ticket: z.string().min(1) });

export function listMessages(bookingId: number) {
  return requestSameOrigin(`/api/bookings/${bookingId}/messages?limit=100`, messagePageSchema);
}

export function sendMessage(bookingId: number, content: string) {
  return requestSameOrigin(`/api/bookings/${bookingId}/messages`, messageSchema, {
    method: "POST",
    body: JSON.stringify(sendMessageSchema.parse({ content })),
  });
}

export function createSocketTicket() {
  return requestSameOrigin("/api/chat/ticket", socketTicketSchema, { method: "POST" });
}
