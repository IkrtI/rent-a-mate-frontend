import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client";
import { clearSessionTokens, readRefreshToken } from "@/modules/session/cookies";
import { assertSameOrigin, routeErrorResponse } from "../../_lib/route";

export async function POST(request: Request) {
  const store = await cookies();
  try {
    assertSameOrigin(request);
    const refreshToken = await readRefreshToken(store);
    if (refreshToken) {
      await requestBackend({
        path: "/auth/logout",
        method: "POST",
        body: { refreshToken },
        responseSchema: z.null(),
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  } finally {
    clearSessionTokens(store);
  }
}
