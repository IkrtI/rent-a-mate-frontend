import { NextResponse } from "next/server";
import { z } from "zod";

import { requestAuthenticatedBackend } from "@/app/api/_lib/session";
import { sessionUserSchema } from "@/modules/session/schemas";
import { assertSameOrigin, RouteError, routeErrorResponse } from "@/app/api/_lib/route";

type Context = { params: Promise<{ path?: string[] }> };
const nameSchema = z.object({ name: z.string().trim().min(1).max(80) });
const emailSchema = z.object({ email: z.string().email(), currentPassword: z.string().min(1) });
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function GET(_request: Request, { params }: Context) {
  try {
    if ((await params).path?.length)
      throw new RouteError(404, "NOT_FOUND", "Account section not found.");
    return NextResponse.json(
      await requestAuthenticatedBackend({ path: "/users/me", responseSchema: sessionUserSchema }),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const path = (await params).path ?? [];
    const section = path.length === 0 ? "name" : path.length === 1 ? path[0] : "";
    const config =
      section === "name"
        ? { backendPath: "/users/me", schema: nameSchema }
        : section === "email"
          ? { backendPath: "/users/me/email", schema: emailSchema }
          : section === "password"
            ? { backendPath: "/users/me/password", schema: passwordSchema }
            : null;
    if (!config) throw new RouteError(404, "NOT_FOUND", "Account section not found.");
    const input = config.schema.parse(await request.json().catch(() => undefined));
    return NextResponse.json(
      await requestAuthenticatedBackend({
        path: config.backendPath,
        method: "PATCH",
        body: input,
        responseSchema: sessionUserSchema,
      }),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
