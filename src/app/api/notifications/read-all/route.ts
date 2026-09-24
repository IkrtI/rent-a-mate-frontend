import { NextResponse } from "next/server";
import { z } from "zod";

import { assertSameOrigin, routeErrorResponse } from "../../_lib/route";
import { requestAuthenticatedBackend } from "../../_lib/session";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const result = await requestAuthenticatedBackend({
      path: "/notifications/read-all",
      method: "PATCH",
      responseSchema: z.object({ updated: z.number().int().nonnegative() }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
