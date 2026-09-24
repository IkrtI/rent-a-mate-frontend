import { z } from "zod";

const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const adminUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "mate", "renter"]),
  isBanned: z.boolean(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminUsersPageSchema = z.object({
  items: z.array(adminUserSchema),
  meta: paginationSchema,
});

export const adminReportSchema = z.object({
  id: z.number(),
  reporterId: z.number(),
  reporter: z.object({ id: z.number(), name: z.string() }),
  targetType: z.enum(["user", "mate", "booking", "review", "message"]),
  targetId: z.number(),
  reason: z.string(),
  status: z.enum(["open", "reviewed", "dismissed", "actioned"]),
  resolutionNote: z.string().nullable(),
  resolvedById: z.number().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const adminReportsPageSchema = z.object({
  items: z.array(adminReportSchema),
  meta: paginationSchema,
});

export const adminBookingSchema = z.object({
  id: z.number(),
  renter: z.object({ id: z.number(), name: z.string() }),
  mate: z.object({ id: z.number(), name: z.string() }),
  activity: z.object({ id: z.number(), name: z.string() }),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalPrice: z.union([z.string(), z.number()]),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminBookingsPageSchema = z.object({
  items: z.array(adminBookingSchema),
  meta: paginationSchema,
});

export const adminPaymentSchema = z.object({
  bookingId: z.number(),
  amount: z.union([z.string(), z.number()]),
  status: z.enum(["pending", "paid", "failed", "refunding", "refunded"]),
  providerReference: z.string().nullable(),
  paidAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  refundedAt: z.string().nullable(),
});

export const adminAnalyticsSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  bookingCounts: z.object({
    pending: z.number(),
    confirmed: z.number(),
    completed: z.number(),
    cancelled: z.number(),
  }),
  paidRevenue: z.number(),
  newActiveUsers: z.number(),
  daily: z.array(
    z.object({
      date: z.string(),
      bookings: z.number(),
      paidRevenue: z.number(),
      newUsers: z.number(),
    }),
  ),
});

export const adminIdentitySchema = z.object({
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["admin", "mate", "renter"]),
  }),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminReport = z.infer<typeof adminReportSchema>;
export type AdminBooking = z.infer<typeof adminBookingSchema>;
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;
export type PageMeta = z.infer<typeof paginationSchema>;
