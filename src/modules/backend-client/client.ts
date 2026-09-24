import "server-only";

import { z } from "zod";

import { getServerEnv } from "@/lib/env";
import { refreshSession, SessionRefreshError } from "@/modules/session/refresh";
import type { CookieStore } from "@/modules/session/cookies";
import type { SessionTokens } from "@/modules/session/types";

import { normalizeBackendError, normalizeNetworkError, unwrapEnvelope } from "./envelope";
import type { AppError } from "./types";

export type BackendRequest<T> = {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  accessToken?: string;
  signal?: AbortSignal;
  responseSchema: z.ZodType<T>;
  session?: {
    cookieStore: CookieStore;
    tokens: SessionTokens;
  };
};

export class BackendClientError extends Error {
  constructor(readonly details: AppError) {
    super(details.message);
    this.name = "BackendClientError";
  }
}

export function canRetryAfterRefresh(
  method: NonNullable<BackendRequest<unknown>["method"]> = "GET",
) {
  return method === "GET";
}

export async function requestBackend<T>(request: BackendRequest<T>): Promise<T> {
  const { backendApiUrl } = getServerEnv();
  const url = new URL(request.path.replace(/^\//, ""), `${backendApiUrl}/`);
  const send = (accessToken: string | undefined) =>
    fetch(url, {
      method: request.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(request.body === undefined || request.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(accessToken === undefined ? {} : { Authorization: `Bearer ${accessToken}` }),
      },
      body:
        request.body === undefined
          ? undefined
          : request.body instanceof FormData
            ? request.body
            : JSON.stringify(request.body),
      cache: "no-store",
      signal: request.signal,
    });

  let response: Response;
  try {
    response = await send(request.accessToken ?? request.session?.tokens.accessToken);
  } catch {
    throw new BackendClientError(normalizeNetworkError());
  }

  if (response.status === 401 && request.session && canRetryAfterRefresh(request.method)) {
    let tokens;
    try {
      tokens = await refreshSession(
        request.session.cookieStore,
        request.session.tokens.refreshToken,
      );
    } catch (error) {
      throw new BackendClientError({
        status: error instanceof SessionRefreshError ? error.status : 503,
        code:
          error instanceof SessionRefreshError && error.isRejected
            ? "SESSION_EXPIRED"
            : "SESSION_REFRESH_UNAVAILABLE",
        message:
          error instanceof SessionRefreshError && error.isRejected
            ? "Your session has expired. Please sign in again."
            : "We could not refresh your session. Please try again shortly.",
        retryable: !(error instanceof SessionRefreshError && error.isRejected),
      });
    }

    try {
      response = await send(tokens.accessToken);
    } catch {
      throw new BackendClientError(normalizeNetworkError());
    }
  }

  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new BackendClientError(normalizeBackendError(response.status, payload));
  }

  return unwrapEnvelope(payload, request.responseSchema);
}
