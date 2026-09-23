import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { BackendClientError, requestBackend } from "@/modules/backend-client/client";
import { clearSessionTokens, writeSessionTokens } from "@/modules/session/cookies";

import { adminLoginSchema } from "@/modules/admin/contracts";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const input = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json(
      { status: "error", message: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  try {
    const result = await requestBackend({
      path: "auth/login",
      method: "POST",
      body: input.data,
      responseSchema: adminLoginSchema,
    });

    if (result.user.role !== "admin") {
      try {
        await requestBackend({
          path: "auth/logout",
          method: "POST",
          body: { refreshToken: result.refreshToken },
          responseSchema: z.null(),
        });
      } catch {
        // Do not persist a non-admin session even if token revocation is temporarily unavailable.
      }
      clearSessionTokens(cookieStore);
      return NextResponse.json(
        { status: "error", message: "This account does not have administrator access." },
        { status: 403 },
      );
    }

    writeSessionTokens(cookieStore, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return NextResponse.json({ status: "success", data: { user: result.user } });
  } catch (error) {
    if (error instanceof BackendClientError) {
      return NextResponse.json(
        { status: "error", message: error.details.message },
        { status: error.details.status || 503 },
      );
    }
    return NextResponse.json(
      { status: "error", message: "Sign in is temporarily unavailable. Try again." },
      { status: 503 },
    );
  }
}
