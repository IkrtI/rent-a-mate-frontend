import "server-only";

import { getServerEnv } from "@/lib/env";

import { BackendClientError } from "./client";
import { normalizeBackendError, normalizeNetworkError } from "./envelope";

export async function requestBackendHealth(): Promise<{ status: "ok" }> {
  const { backendApiUrl } = getServerEnv();
  const healthUrl = new URL("/", new URL(backendApiUrl).origin);

  let response: Response;
  try {
    response = await fetch(healthUrl, { cache: "no-store" });
  } catch {
    throw new BackendClientError(normalizeNetworkError());
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => undefined);
    throw new BackendClientError(normalizeBackendError(response.status, payload));
  }

  const message = await response.text();
  if (message !== "Hello World!") {
    throw new BackendClientError({
      status: 502,
      code: "UNEXPECTED_HEALTH_RESPONSE",
      message: "The backend health response was not recognized.",
      retryable: true,
    });
  }

  return { status: "ok" };
}
