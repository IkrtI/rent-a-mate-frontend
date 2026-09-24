import { z } from "zod";

export const sessionUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email().optional(),
  role: z.enum(["renter", "mate", "admin"]),
});

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
