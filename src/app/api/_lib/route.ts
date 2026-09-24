import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";

import { BackendClientError } from "@/modules/backend-client";
import { SessionRefreshError } from "@/modules/session/refresh";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  // Reverse proxies can terminate HTTPS and forward an internal HTTP request.
  // Prefer the externally visible origin forwarded by the trusted proxy.
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedOrigin =
    forwardedHost && forwardedProtocol ? `${forwardedProtocol}://${forwardedHost}` : undefined;
  const configuredOrigin =
    process.env.APP_ORIGIN ||
    (process.env.NODE_ENV === "production"
      ? "https://test-host.invalid"
      : process.env.NEXT_PUBLIC_APP_URL);
  const expectedOrigin = configuredOrigin
    ? new URL(configuredOrigin).origin
    : forwardedOrigin ?? new URL(request.url).origin;
  if (origin && origin !== expectedOrigin) {
    throw new RouteError(403, "CROSS_ORIGIN_REQUEST", "Cross-origin request rejected.");
  }
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await request.json().catch(() => undefined);
  return schema.parse(body);
}

export class RouteError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function routeErrorResponse(error: unknown): NextResponse {
  if (error instanceof SessionRefreshError) {
    const status = error.isRejected ? 401 : error.status;
    return NextResponse.json(
      {
        error: {
          status,
          code: error.isRejected ? "SESSION_EXPIRED" : "SESSION_REFRESH_UNAVAILABLE",
          message: error.isRejected
            ? "Your session has expired. Please sign in again."
            : "We could not refresh your session. Please try again shortly.",
          retryable: !error.isRejected,
        },
      },
      { status },
    );
  }
  if (error instanceof BackendClientError) {
    return NextResponse.json({ error: error.details }, { status: error.details.status || 503 });
  }
  if (error instanceof RouteError) {
    return NextResponse.json(
      {
        error: { status: error.status, code: error.code, message: error.message, retryable: false },
      },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Please check the submitted information.",
          fieldErrors: error.flatten().fieldErrors,
          retryable: false,
        },
      },
      { status: 400 },
    );
  }
  return NextResponse.json(
    {
      error: {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "The request could not be completed.",
        retryable: true,
      },
    },
    { status: 500 },
  );
}
