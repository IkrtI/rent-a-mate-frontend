import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requestBackend } from "@/modules/backend-client/client";
import { clearSessionTokens, readSessionTokens } from "@/modules/session/cookies";

export async function POST() {
  const cookieStore = await cookies();
  const tokens = await readSessionTokens(cookieStore);
  if (tokens) {
    try {
      await requestBackend({
        path: "auth/logout",
        method: "POST",
        body: { refreshToken: tokens.refreshToken },
        responseSchema: z.null(),
      });
    } catch {
      // Clearing local cookies is the logout guarantee even while the backend is unavailable.
    }
  }
  clearSessionTokens(cookieStore);
  return NextResponse.json({ status: "success" });
}
