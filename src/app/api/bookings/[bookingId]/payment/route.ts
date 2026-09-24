import { NextResponse } from "next/server";

import { createPaymentSchema, paymentSchema } from "@/modules/booking/schemas";
import { assertSameOrigin, routeErrorResponse } from "../../../_lib/route";
import { requestAuthenticatedBackend } from "../../../_lib/session";

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { bookingId } = await context.params;
    const result = await requestAuthenticatedBackend({
      path: `/bookings/${encodeURIComponent(bookingId)}/payment`,
      responseSchema: paymentSchema,
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
    const result = await requestAuthenticatedBackend({
      path: `/bookings/${encodeURIComponent(bookingId)}/payment`,
      method: "POST",
      responseSchema: createPaymentSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
