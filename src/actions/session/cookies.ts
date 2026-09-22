import "server-only";

import { cookies } from "next/headers";

import { getServerEnv } from "@/utils/env";

import type { SessionTokens } from "./types";

export const sessionCookieNames = {
  access: "ram_access",
  refresh: "ram_refresh",
} as const;

const accessCookieMaxAgeSeconds = 15 * 60;
const refreshCookieMaxAgeSeconds = 30 * 24 * 60 * 60;

export type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function createSessionCookieOptions(
  isProduction: boolean,
  maxAge = accessCookieMaxAgeSeconds,
) {
  return {
    httpOnly: true,
    maxAge,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

export async function readSessionTokens(store?: CookieStore): Promise<SessionTokens | null> {
  const resolvedStore = store ?? (await cookies());
  const accessToken = resolvedStore.get(sessionCookieNames.access)?.value;
  const refreshToken = resolvedStore.get(sessionCookieNames.refresh)?.value;

  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

export function writeSessionTokens(store: CookieStore, tokens: SessionTokens): void {
  const isCookieSecure = getServerEnv().isCookieSecure;
  store.set(
    sessionCookieNames.access,
    tokens.accessToken,
    createSessionCookieOptions(isCookieSecure),
  );
  store.set(
    sessionCookieNames.refresh,
    tokens.refreshToken,
    createSessionCookieOptions(isCookieSecure, refreshCookieMaxAgeSeconds),
  );
}

export function clearSessionTokens(store: CookieStore): void {
  store.delete(sessionCookieNames.access);
  store.delete(sessionCookieNames.refresh);
}
