import { NextResponse } from "next/server";

import { reviewInputSchema, reviewSchema } from "@/modules/booking/schemas";
import { assertSameOrigin, parseJson, routeErrorResponse } from "../../../_lib/route";
import { requestAuthenticatedBackend } from "../../../_lib/session";

type Context = { params: Promise<{ bookingId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { bookingId } = await context.params;
    const input = await parseJson(request, reviewInputSchema);
    const result = await requestAuthenticatedBackend({
      path: `/bookings/${encodeURIComponent(bookingId)}/review`,
      method: "POST",
      body: input,
      responseSchema: reviewSchema,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
