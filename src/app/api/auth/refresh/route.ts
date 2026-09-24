import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client";
import { readRefreshToken } from "@/modules/session";
import { refreshSession } from "@/modules/session/refresh";
import { sessionUserSchema } from "@/modules/session/schemas";

import { assertSameOrigin, RouteError, routeErrorResponse } from "../../_lib/route";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const store = await cookies();
    const refreshToken = await readRefreshToken(store);
    if (!refreshToken) {
      throw new RouteError(401, "SESSION_REQUIRED", "Please sign in to continue.");
    }
    const tokens = await refreshSession(store, refreshToken);
    const result = await requestBackend({
      path: "/auth/me",
      accessToken: tokens.accessToken,
      responseSchema: z.object({ user: sessionUserSchema }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
