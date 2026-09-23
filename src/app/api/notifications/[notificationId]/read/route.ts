import { NextResponse } from "next/server";
import { z } from "zod";

import { notificationSchema } from "@/modules/notification/schemas";
import { assertSameOrigin, routeErrorResponse } from "../../../_lib/route";
import { requestAuthenticatedBackend } from "../../../_lib/session";

type Context = { params: Promise<{ notificationId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { notificationId } = await context.params;
    const result = await requestAuthenticatedBackend({
      path: `/notifications/${encodeURIComponent(notificationId)}/read`,
      method: "PATCH",
      responseSchema: z.object({ notification: notificationSchema }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
