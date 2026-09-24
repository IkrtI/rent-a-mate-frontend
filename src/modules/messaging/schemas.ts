import { z } from "zod";

export const messageSchema = z.object({
  id: z.number().int().positive(),
  bookingId: z.number().int().positive(),
  senderId: z.number().int().positive(),
  content: z.string(),
  readAt: z.union([z.string(), z.number()]).nullable(),
  createdAt: z.union([z.string(), z.number()]),
});

export type Message = z.infer<typeof messageSchema>;

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type MessagePage = z.infer<typeof messagePageSchema>;

export const sendMessageSchema = z.object({
  clientMessageId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
});
