import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client/client";
import { lookupSchema } from "@/modules/mate-profile/schemas";
import { RouteError, routeErrorResponse } from "../../../_lib/route";

type Context = { params: Promise<{ provinceId: string }> };
const resultSchema = z.object({ items: z.array(lookupSchema) });

export async function GET(_request: Request, { params }: Context) {
  try {
    const { provinceId } = await params;
    if (!/^[1-9]\d*$/.test(provinceId))
      throw new RouteError(400, "INVALID_PROVINCE", "Choose a valid province.");
    return NextResponse.json(
      await requestBackend({
        path: `/provinces/${provinceId}/districts`,
        responseSchema: resultSchema,
      }),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
