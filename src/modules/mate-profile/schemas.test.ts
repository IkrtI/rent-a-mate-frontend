import { describe, expect, it } from "vitest";

import { availabilitySlotSchema, profileInputSchema, replaceAvailabilitySchema } from "./schemas";

describe("mate profile form schemas", () => {
  it("accepts a valid profile and rejects out of range ages or extra decimal places", () => {
    const profile = {
      age: 18,
      bio: "Coffee walks",
      hourlyRate: 19.99,
      provinceId: 1,
      districtId: 2,
      activityIds: [3],
      interestIds: [4],
    };
    expect(profileInputSchema.safeParse(profile).success).toBe(true);
    expect(profileInputSchema.safeParse({ ...profile, age: 17 }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...profile, hourlyRate: 125.555 }).success).toBe(false);
  });

  it("requires ordered times and rejects overlapping weekly slots before submitting", () => {
    expect(
      availabilitySlotSchema.safeParse({ dayOfWeek: 1, startTime: "09:00", endTime: "10:00" })
        .success,
    ).toBe(true);
    expect(
      availabilitySlotSchema.safeParse({ dayOfWeek: 1, startTime: "10:00", endTime: "09:00" })
        .success,
    ).toBe(false);
    expect(
      replaceAvailabilitySchema.safeParse({
        slots: [
          { dayOfWeek: 2, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: 2, startTime: "11:30", endTime: "13:00" },
        ],
      }).success,
    ).toBe(false);
    expect(
      replaceAvailabilitySchema.safeParse({
        slots: [
          { dayOfWeek: 2, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: 2, startTime: "12:00", endTime: "13:00" },
        ],
      }).success,
    ).toBe(true);
  });
});
