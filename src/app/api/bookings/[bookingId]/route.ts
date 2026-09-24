import { NextResponse } from "next/server";

import { bookingSchema } from "@/modules/booking/schemas";
import { routeErrorResponse } from "../../_lib/route";
import { requestAuthenticatedBackend } from "../../_lib/session";

type Context = { params: Promise<{ bookingId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { bookingId } = await context.params;
    const result = await requestAuthenticatedBackend({
      path: `/bookings/${encodeURIComponent(bookingId)}`,
      responseSchema: bookingSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
