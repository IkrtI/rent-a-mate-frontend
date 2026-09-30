import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client";
import { sessionUserSchema } from "@/modules/session/schemas";
import { assertSameOrigin, parseJson, routeErrorResponse } from "../../_lib/route";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["renter", "mate"]),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = await parseJson(request, registerSchema);
    const result = await requestBackend({
      path: "/auth/register",
      method: "POST",
      body: input,
      responseSchema: z.object({ user: sessionUserSchema }),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
