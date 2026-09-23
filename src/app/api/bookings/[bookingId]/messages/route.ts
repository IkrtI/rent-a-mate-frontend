import { NextResponse } from "next/server";

import { messagePageSchema, messageSchema, sendMessageSchema } from "@/modules/messaging/schemas";
import { assertSameOrigin, parseJson, routeErrorResponse } from "../../../_lib/route";
import { requestAuthenticatedBackend } from "../../../_lib/session";

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { bookingId } = await context.params;
    const incoming = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of ["page", "limit"] as const) {
      const value = incoming.get(key);
      if (value) query.set(key, value);
    }
    const result = await requestAuthenticatedBackend({
      path: `/bookings/${encodeURIComponent(bookingId)}/messages${query.size ? `?${query}` : ""}`,
      responseSchema: messagePageSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { bookingId } = await context.params;
    const input = await parseJson(request, sendMessageSchema);
    const result = await requestAuthenticatedBackend({
      path: `/bookings/${encodeURIComponent(bookingId)}/messages`,
      method: "POST",
      body: input,
      responseSchema: messageSchema,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
