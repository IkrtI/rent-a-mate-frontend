import { NextResponse } from "next/server";

import { paymentPageSchema } from "@/modules/booking/schemas";
import { routeErrorResponse } from "../_lib/route";
import { requestAuthenticatedBackend } from "../_lib/session";

export async function GET(request: Request) {
  try {
    const incoming = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of ["page", "limit"] as const) {
      const value = incoming.get(key);
      if (value) query.set(key, value);
    }
    const result = await requestAuthenticatedBackend({
      path: `/payments${query.size ? `?${query}` : ""}`,
      responseSchema: paymentPageSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
