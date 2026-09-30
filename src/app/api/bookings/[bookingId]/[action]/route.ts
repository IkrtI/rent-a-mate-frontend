import { NextResponse } from "next/server";
import { z } from "zod";

import { bookingStatusSchema } from "@/modules/booking/schemas";
import { assertSameOrigin, RouteError, routeErrorResponse } from "../../../_lib/route";
import { requestAuthenticatedBackend } from "../../../_lib/session";

const actionSchema = z.enum(["accept", "decline", "cancel", "complete"]);
const resultSchema = z
  .object({ id: z.number().int().positive(), status: bookingStatusSchema })
  .passthrough();
type Context = { params: Promise<{ bookingId: string; action: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { bookingId, action } = await context.params;
    const parsed = actionSchema.safeParse(action);
    if (!parsed.success) throw new RouteError(404, "NOT_FOUND", "Booking action not found.");
    const result = await requestAuthenticatedBackend({
      path: `/bookings/${encodeURIComponent(bookingId)}/${parsed.data}`,
      method: "PATCH",
      responseSchema: resultSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
