"use client";

import { z } from "zod";

import type { AppError } from "./types";

const errorSchema = z.object({
  error: z.object({
    status: z.number(),
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    retryable: z.boolean(),
  }),
});

export class BrowserClientError extends Error {
  constructor(readonly details: AppError) {
    super(details.message);
    this.name = "BrowserClientError";
  }
}

export async function requestSameOrigin<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = errorSchema.safeParse(payload);
    throw new BrowserClientError(
      parsed.success
        ? parsed.data.error
        : {
            status: response.status,
            code: response.status === 401 ? "SESSION_REQUIRED" : "REQUEST_FAILED",
            message: "The request could not be completed.",
            retryable: response.status >= 500,
          },
    );
  }
  return schema.parse(payload);
}
