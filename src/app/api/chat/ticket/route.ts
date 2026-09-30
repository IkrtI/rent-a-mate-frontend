import { NextResponse } from "next/server";
import { z } from "zod";

import { assertSameOrigin, routeErrorResponse } from "../../_lib/route";
import { requestAuthenticatedBackend } from "../../_lib/session";

const socketTicketSchema = z.object({ ticket: z.string().min(1) });

/**
 * BFF boundary for Socket.IO credentials. The browser receives only a short-
 * lived, single-use socket ticket; the HttpOnly access JWT stays server-side.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const result = await requestAuthenticatedBackend({
      path: "/auth/socket-ticket",
      method: "POST",
      responseSchema: socketTicketSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
