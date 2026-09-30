import { NextResponse } from "next/server";

import { notificationsSchema } from "@/modules/notification/schemas";
import { routeErrorResponse } from "../_lib/route";
import { requestAuthenticatedBackend } from "../_lib/session";

export async function GET(request: Request) {
  try {
    const unreadOnly = new URL(request.url).searchParams.get("unreadOnly") === "true";
    const result = await requestAuthenticatedBackend({
      path: `/notifications${unreadOnly ? "?unreadOnly=true" : ""}`,
      responseSchema: notificationsSchema,
    });
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
