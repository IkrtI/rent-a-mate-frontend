import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client";
import { writeSessionTokens } from "@/modules/session";
import { sessionUserSchema, tokenPairSchema } from "@/modules/session/schemas";
import { assertSameOrigin, parseJson, routeErrorResponse } from "../../_lib/route";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const loginResultSchema = tokenPairSchema.extend({ user: sessionUserSchema });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const credentials = await parseJson(request, loginSchema);
    const result = await requestBackend({
      path: "/auth/login",
      method: "POST",
      body: credentials,
      responseSchema: loginResultSchema,
    });
    writeSessionTokens(await cookies(), result);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
