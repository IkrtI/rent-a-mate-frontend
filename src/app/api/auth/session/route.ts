import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client";
import { clearSessionTokens } from "@/modules/session";
import { sessionUserSchema } from "@/modules/session/schemas";
import { resolveSessionTokens } from "@/modules/session/server";
import { routeErrorResponse, RouteError } from "../../_lib/route";

export async function GET() {
  try {
    const session = await resolveSessionTokens();
    if (!session) throw new RouteError(401, "SESSION_REQUIRED", "Please sign in to continue.");
    const result = await requestBackend({
      path: "/auth/me",
      responseSchema: z.object({ user: sessionUserSchema }),
      session,
    });
    return NextResponse.json(result);
  } catch (error) {
    // A failed backend request is not proof that a valid local session was revoked.
    // `refreshSession` clears cookies only when the refresh token is rejected.
    if (
      error instanceof RouteError ||
      (error instanceof Error && error.name === "SessionRefreshError")
    ) {
      return routeErrorResponse(error);
    }
    // /auth/me returning an authorization error is definitive, unlike a network failure.
    if (error instanceof Error && error.name === "BackendClientError") {
      const details = (error as { details?: { status?: number } }).details;
      if (details?.status === 401 || details?.status === 403) {
        const session = await resolveSessionTokens().catch(() => null);
        if (session) clearSessionTokens(session.cookieStore);
      }
    }
    return routeErrorResponse(error);
  }
}
