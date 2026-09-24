import { z } from "zod";

export const lookupSchema = z.object({ id: z.number().int().positive(), name: z.string() });
export const mateAvailabilitySchema = z.object({
  id: z.number().int().positive(),
  mateId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export const matePhotoSchema = z.object({
  id: z.number().int().positive(),
  mateId: z.number().int().positive(),
  url: z.string(),
  storageKey: z.string().nullable().optional(),
  sortOrder: z.number(),
  createdAt: z.string().optional(),
});
export const mateProfileSchema = z.object({
  id: z.number().int().positive(),
  user: z.object({ id: z.number(), name: z.string() }),
  age: z.number().nullable(),
  bio: z.string().nullable(),
  hourlyRate: z.number(),
  isActive: z.boolean(),
  deactivatedAt: z.string().nullable().optional(),
  province: lookupSchema,
  district: lookupSchema,
  activities: z.array(lookupSchema),
  interests: z.array(lookupSchema),
  photos: z.array(matePhotoSchema),
  availability: z.array(mateAvailabilitySchema),
});
export const mateResultSchema = z.object({ mate: mateProfileSchema });
export const profileInputSchema = z.object({
  age: z.number().int().min(18).max(120),
  bio: z.string().trim().min(1).max(2000).optional(),
  hourlyRate: z
    .number()
    .positive()
    .refine((value) => Number(value.toFixed(2)) === value, "Use at most two decimal places."),
  provinceId: z.number().int().positive(),
  districtId: z.number().int().positive(),
  activityIds: z.array(z.number().int().positive()).max(100),
  interestIds: z.array(z.number().int().positive()).max(100),
});
export const availabilitySlotSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .refine(({ startTime, endTime }) => startTime < endTime, {
    message: "End time must be after start time.",
  });
export const replaceAvailabilitySchema = z
  .object({ slots: z.array(availabilitySlotSchema).max(70) })
  .superRefine(({ slots }, context) => {
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (
        slots
          .slice(index + 1)
          .some(
            (other) =>
              other.dayOfWeek === slot.dayOfWeek &&
              slot.startTime < other.endTime &&
              other.startTime < slot.endTime,
          )
      ) {
        context.addIssue({
          code: "custom",
          path: ["slots", index],
          message: "Availability slots cannot overlap.",
        });
      }
    }
  });

export type MateProfile = z.infer<typeof mateProfileSchema>;
