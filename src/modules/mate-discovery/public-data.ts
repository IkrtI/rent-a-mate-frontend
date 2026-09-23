import { z } from "zod";

import { requestBackend } from "@/modules/backend-client/client";

const lookupSchema = z.object({ id: z.number(), name: z.string() });
const mateSchema = z.object({
  id: z.number(),
  name: z.string(),
  hourlyRate: z.number(),
  avgRating: z.number().nullable(),
  reviewCount: z.number(),
  province: z.string(),
  district: z.string(),
  activities: z.array(z.string()),
  photoUrl: z.string().nullable(),
});
const pageSchema = z.object({
  items: z.array(mateSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
const publicDetailSchema = z.object({
  id: z.number(),
  user: z.object({ id: z.number(), name: z.string() }),
  age: z.number().nullable(),
  bio: z.string().nullable(),
  hourlyRate: z.number(),
  isActive: z.boolean(),
  province: lookupSchema,
  district: lookupSchema,
  activities: z.array(lookupSchema),
  interests: z.array(lookupSchema),
  photos: z.array(z.object({ id: z.number(), url: z.string(), sortOrder: z.number() })),
});
const detailResponseSchema = z.object({ mate: publicDetailSchema });
const reviewResponseSchema = z.object({
  averageRating: z.number().nullable(),
  reviewCount: z.number(),
  items: z.array(
    z.object({
      id: z.number(),
      rating: z.number(),
      comment: z.string().nullable(),
      renter: lookupSchema,
      createdAt: z.string(),
    }),
  ),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type PublicMate = z.infer<typeof mateSchema>;
export type PublicMateDetail = z.infer<typeof publicDetailSchema>;
export type DirectoryResult = {
  items: PublicMate[];
  page: number;
  total: number;
  totalPages: number;
  error: boolean;
};

type SearchInput = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPublicMates(search: SearchInput): Promise<DirectoryResult> {
  const params = new URLSearchParams();
  const query = first(search.q)?.trim().slice(0, 100);
  const activity = first(search.activity)?.trim();
  const page = Math.max(1, Math.min(10000, Number(first(search.page)) || 1));
  const sortValues = ["rating", "-rating", "rate", "-rate", "createdAt", "-createdAt"] as const;
  const rawSort = first(search.sort);
  const sort = sortValues.includes(rawSort as (typeof sortValues)[number]) ? rawSort! : "-rating";
  const minRate = Number(first(search.minRate));
  const maxRate = Number(first(search.maxRate));
  const minRating = Number(first(search.rating));
  if (Number.isFinite(minRate) && minRate >= 0 && first(search.minRate))
    params.set("minRate", String(minRate));
  if (Number.isFinite(maxRate) && maxRate >= 0 && first(search.maxRate))
    params.set("maxRate", String(maxRate));
  if (Number.isFinite(minRating) && minRating >= 0 && minRating <= 5 && first(search.rating))
    params.set("minRating", String(minRating));
  if (params.has("minRate") && params.has("maxRate") && minRate > maxRate) {
    params.delete("minRate");
    params.delete("maxRate");
  }
  if (query) params.set("q", query);
  if (activity) {
    const numericId = /^\d+$/.test(activity) ? Number(activity) : null;
    if (numericId) params.append("activityId", String(numericId));
    else {
      try {
        const response = await requestBackend({
          path: "activities",
          responseSchema: z.object({ items: z.array(lookupSchema) }),
        });
        const match = response.items.find(
          ({ name }) => name.toLowerCase() === activity.toLowerCase(),
        );
        if (!match) return { items: [], page, total: 0, totalPages: 0, error: false };
        params.append("activityId", String(match.id));
      } catch {
        return { items: [], page, total: 0, totalPages: 0, error: true };
      }
    }
  }
  params.set("sort", sort);
  params.set("page", String(page));
  params.set("limit", "12");
  try {
    const result = await requestBackend({ path: `mates?${params}`, responseSchema: pageSchema });
    return {
      items: result.items,
      page: result.meta.page,
      total: result.meta.total,
      totalPages: result.meta.totalPages,
      error: false,
    };
  } catch {
    return { items: [], page, total: 0, totalPages: 0, error: true };
  }
}

export async function getPublicMate(id: number): Promise<PublicMateDetail | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  try {
    const response = await requestBackend({
      path: `mates/${id}`,
      responseSchema: detailResponseSchema,
    });
    return response.mate;
  } catch {
    return null;
  }
}

export async function getPublicMateReviews(id: number) {
  try {
    return await requestBackend({
      path: `mates/${id}/reviews?page=1&limit=10`,
      responseSchema: reviewResponseSchema,
    });
  } catch {
    return null;
  }
}
