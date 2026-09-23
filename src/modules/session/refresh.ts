import "server-only";

import { z } from "zod";

import { getServerEnv } from "@/lib/env";

import { clearSessionTokens, writeSessionTokens, type CookieStore } from "./cookies";
import type { SessionTokens } from "./types";

const refreshResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
  }),
});

const refreshLocks = new Map<string, Promise<SessionTokens>>();

export function withRefreshLock(
  refreshToken: string,
  refresh: () => Promise<SessionTokens>,
): Promise<SessionTokens> {
  const pending = refreshLocks.get(refreshToken);
  if (pending) {
    return pending;
  }

  const operation = refresh().finally(() => refreshLocks.delete(refreshToken));
  refreshLocks.set(refreshToken, operation);
  return operation;
}

export async function refreshSession(
  cookieStore: CookieStore,
  refreshToken: string,
): Promise<SessionTokens> {
  try {
    const tokens = await withRefreshLock(refreshToken, async () => {
      const { backendApiUrl } = getServerEnv();
      const response = await fetch(`${backendApiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) {
        throw new Error("Session refresh was rejected.");
      }

      return refreshResponseSchema.parse(payload).data;
    });
    writeSessionTokens(cookieStore, tokens);
    return tokens;
  } catch (error) {
    clearSessionTokens(cookieStore);
    throw error;
  }
}
