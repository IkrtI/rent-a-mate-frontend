import "server-only";

import { cookies } from "next/headers";

import { readRefreshToken, readSessionTokens, type CookieStore } from "./cookies";
import { refreshSession } from "./refresh";
import type { SessionTokens } from "./types";

const refreshWindowSeconds = 30;

function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

export function shouldRefreshAccessToken(token: string, nowSeconds = Date.now() / 1000): boolean {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt === null || expiresAt <= nowSeconds + refreshWindowSeconds;
}

export async function resolveSessionTokens(
  store?: CookieStore,
): Promise<{ cookieStore: CookieStore; tokens: SessionTokens } | null> {
  const cookieStore = store ?? (await cookies());
  const current = await readSessionTokens(cookieStore);
  if (current && !shouldRefreshAccessToken(current.accessToken)) {
    return { cookieStore, tokens: current };
  }

  const refreshToken = current?.refreshToken ?? (await readRefreshToken(cookieStore));
  if (!refreshToken) return null;

  return { cookieStore, tokens: await refreshSession(cookieStore, refreshToken) };
}
