import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client";
import { clearSessionTokens } from "@/modules/session";
import { sessionUserSchema } from "@/modules/session/schemas";
import { resolveSessionTokens } from "@/modules/session/server";
import { routeErrorResponse } from "../../_lib/route";

export async function GET() {
  const session = await resolveSessionTokens().catch(() => null);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  try {
    const result = await requestBackend({
      path: "/auth/me",
      responseSchema: z.object({ user: sessionUserSchema }),
      session,
    });
    return NextResponse.json(result);
  } catch (error) {
    clearSessionTokens(session.cookieStore);
    return routeErrorResponse(error);
  }
}
