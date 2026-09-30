import { NextResponse } from "next/server";

import { reviewInputSchema, reviewSchema } from "@/modules/booking/schemas";
import { assertSameOrigin, parseJson, routeErrorResponse } from "../../_lib/route";
import { requestAuthenticatedBackend } from "../../_lib/session";

type Context = { params: Promise<{ reviewId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { reviewId } = await context.params;
    const input = await parseJson(request, reviewInputSchema);
    const result = await requestAuthenticatedBackend({
      path: `/reviews/${encodeURIComponent(reviewId)}`,
      method: "PATCH",
      body: input,
      responseSchema: reviewSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { reviewId } = await context.params;
    await requestAuthenticatedBackend({
      path: `/reviews/${encodeURIComponent(reviewId)}`,
      method: "DELETE",
      responseSchema: reviewSchema.pick({ id: true }).nullable(),
    });
    return NextResponse.json({ id: Number(reviewId) });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
