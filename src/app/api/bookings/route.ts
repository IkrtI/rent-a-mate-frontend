import { NextResponse } from "next/server";

import {
  bookingPageSchema,
  createBookingInputSchema,
  createBookingResultSchema,
} from "@/modules/booking/schemas";
import { assertSameOrigin, parseJson, routeErrorResponse } from "../_lib/route";
import { requestAuthenticatedBackend } from "../_lib/session";

export async function GET(request: Request) {
  try {
    const incoming = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of ["status", "page", "limit"] as const) {
      const value = incoming.get(key);
      if (value) query.set(key, value);
    }
    const result = await requestAuthenticatedBackend({
      path: `/bookings${query.size ? `?${query.toString()}` : ""}`,
      responseSchema: bookingPageSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = await parseJson(request, createBookingInputSchema);
    const result = await requestAuthenticatedBackend({
      path: "/bookings",
      method: "POST",
      body: input,
      responseSchema: createBookingResultSchema,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
