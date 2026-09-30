import { z } from "zod";

export const notificationSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  type: z.string(),
  message: z.string(),
  bookingId: z.number().int().positive().nullable(),
  isRead: z.boolean(),
  createdAt: z.union([z.string(), z.number()]),
});

export type Notification = z.infer<typeof notificationSchema>;
export const notificationsSchema = z.object({ notifications: z.array(notificationSchema) });
