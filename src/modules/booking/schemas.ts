import { z } from "zod";

export const bookingStatusSchema = z.enum(["pending", "confirmed", "completed", "cancelled"]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

const participantSchema = z.object({ id: z.number().int().positive(), name: z.string() });
const dateValueSchema = z.union([z.string(), z.number()]);

export const bookingSchema = z.object({
  id: z.number().int().positive(),
  status: bookingStatusSchema,
  date: dateValueSchema,
  startTime: dateValueSchema,
  endTime: dateValueSchema,
  totalPrice: z.union([z.string(), z.number()]),
  createdAt: dateValueSchema,
  updatedAt: dateValueSchema,
  renter: participantSchema,
  mate: participantSchema,
  activity: participantSchema,
  review: z
    .object({
      id: z.number().int().positive(),
      rating: z.number(),
      comment: z.string().nullable(),
      createdAt: dateValueSchema,
      updatedAt: dateValueSchema,
    })
    .nullable(),
});

export type Booking = z.infer<typeof bookingSchema>;

export const bookingPageSchema = z.object({
  items: z.array(bookingSchema),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const createBookingInputSchema = z.object({
  mateId: z.number().int().positive(),
  activityId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const createBookingResultSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal("pending"),
  totalPrice: z.union([z.string(), z.number()]),
});
