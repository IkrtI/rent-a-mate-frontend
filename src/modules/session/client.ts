"use client";

import { z } from "zod";

import { BrowserClientError, requestSameOrigin } from "@/modules/backend-client/browser";

import { sessionUserSchema } from "./schemas";
import type { SessionUser } from "./types";

const sessionResponseSchema = z.object({ user: sessionUserSchema });

export const SessionRequestError = BrowserClientError;

export function getSession(): Promise<{ user: SessionUser }> {
  return requestSameOrigin("/api/auth/session", sessionResponseSchema);
}

export function login(input: { email: string; password: string }): Promise<{ user: SessionUser }> {
  return requestSameOrigin("/api/auth/login", sessionResponseSchema, {
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
  return requestSameOrigin("/api/auth/register", sessionResponseSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout(): Promise<void> {
  await requestSameOrigin("/api/auth/logout", z.object({ success: z.literal(true) }), {
    method: "POST",
  });
}
