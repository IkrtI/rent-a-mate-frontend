import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";

import { BackendClientError } from "@/modules/backend-client";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
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
