import { z } from "zod";

import { BackendClientError, requestBackend } from "@/modules/backend-client/client";
import { lookupSchema } from "@/modules/mate-profile/schemas";

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
export type DiscoveryLookups = {
  activities: { id: number; name: string }[];
  interests: { id: number; name: string }[];
  provinces: { id: number; name: string }[];
  error: boolean;
};
export type PublicMateDetail = z.infer<typeof publicDetailSchema>;
export type DirectoryResult = {
  items: PublicMate[];
  page: number;
  total: number;
  totalPages: number;
  error: boolean;
};

function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

type SearchInput = Record<string, string | string[] | undefined>;

export async function getDiscoveryLookups(): Promise<DiscoveryLookups> {
  const resultSchema = z.object({ items: z.array(lookupSchema) });
  const endpoints = ["activities", "interests", "provinces"] as const;
  const results = await Promise.all(
    endpoints.map(async (path) => {
      try {
        return {
          items: (await requestBackend({ path, responseSchema: resultSchema })).items,
          error: false,
        };
      } catch {
        return { items: [], error: true };
      }
    }),
  );
  return {
    activities: results[0].items,
    interests: results[1].items,
    provinces: results[2].items,
    error: results.some((result) => result.error),
  };
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function values(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value === undefined ? [] : [value]).filter(Boolean);
}

const sortValues = ["rating", "-rating", "rate", "-rate", "createdAt", "-createdAt"] as const;

export function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function buildMateSearchParams(search: SearchInput, today = bangkokToday()) {
  const params = new URLSearchParams();
  const query = first(search.q)?.trim().slice(0, 100);
  const pageValue = Number(first(search.page));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? Math.min(10000, pageValue) : 1;
  const sortRaw = first(search.sort);
  const sort = sortValues.includes(sortRaw as (typeof sortValues)[number])
    ? sortRaw!
    : "-createdAt";
  const minRateText = first(search.minRate);
  const maxRateText = first(search.maxRate);
  const minRate = Number(minRateText);
  const maxRate = Number(maxRateText);
  const validRate = (text: string | undefined, value: number) =>
    !!text && /^\d+(\.\d{1,2})?$/.test(text) && Number.isFinite(value);
  const ratesValid =
    (!minRateText || validRate(minRateText, minRate)) &&
    (!maxRateText || validRate(maxRateText, maxRate)) &&
    (!minRateText || !maxRateText || minRate <= maxRate);
  if (ratesValid && minRateText) params.set("minRate", minRateText);
  if (ratesValid && maxRateText) params.set("maxRate", maxRateText);

  const minRatingText = first(search.minRating) ?? first(search.rating);
  const minRating = Number(minRatingText);
  if (minRatingText && Number.isFinite(minRating) && minRating >= 0 && minRating <= 5)
    params.set("minRating", String(minRating));
  for (const key of ["activityId", "interestId"] as const) {
    for (const value of values(search[key])) {
      if (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)))
        params.append(key, String(Number(value)));
    }
  }
  const provinceId = first(search.provinceId);
  const districtId = first(search.districtId);
  if (provinceId && /^[1-9]\d*$/.test(provinceId))
    params.set("provinceId", String(Number(provinceId)));
  if (districtId && provinceId && /^[1-9]\d*$/.test(districtId))
    params.set("districtId", String(Number(districtId)));
  const availableDate = first(search.availableDate);
  if (availableDate && isValidCalendarDate(availableDate) && availableDate >= today)
    params.set("availableDate", availableDate);
  if (query) params.set("q", query);
  params.set("sort", sort);
  params.set("page", String(page));
  params.set("limit", "12");
  return params;
}

export async function getPublicMates(search: SearchInput): Promise<DirectoryResult> {
  const params = buildMateSearchParams(search);
  const activity = first(search.activity)?.trim();
  const page = Number(params.get("page"));
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

export async function getPublicMate(
  id: number,
): Promise<{ mate: PublicMateDetail | null; error: boolean }> {
  if (!Number.isSafeInteger(id) || id <= 0) return { mate: null, error: false };
  try {
    const response = await requestBackend({
      path: `mates/${id}`,
      responseSchema: detailResponseSchema,
    });
    return { mate: response.mate, error: false };
  } catch (error) {
    if (error instanceof BackendClientError && error.details.status === 404)
      return { mate: null, error: false };
    return { mate: null, error: true };
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
