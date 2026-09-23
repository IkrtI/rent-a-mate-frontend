"use client";

import { z } from "zod";

import type { AppError } from "@/modules/backend-client";

import { sessionUserSchema } from "./schemas";
import type { SessionUser } from "./types";

const errorSchema = z.object({
  error: z.object({
    status: z.number(),
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    retryable: z.boolean(),
  }),
});

const sessionResponseSchema = z.object({ user: sessionUserSchema });

export class SessionRequestError extends Error {
  constructor(readonly details: AppError) {
    super(details.message);
    this.name = "SessionRequestError";
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = errorSchema.safeParse(payload);
    throw new SessionRequestError(
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

export function getSession(): Promise<{ user: SessionUser }> {
  return request("/api/auth/session", sessionResponseSchema);
}

export function login(input: { email: string; password: string }): Promise<{ user: SessionUser }> {
  return request("/api/auth/login", sessionResponseSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: {
  name: string;
  email: string;
  password: string;
  role: "renter" | "mate";
}): Promise<{ user: SessionUser }> {
  return request("/api/auth/register", sessionResponseSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout(): Promise<void> {
  await request("/api/auth/logout", z.object({ success: z.literal(true) }), { method: "POST" });
}
