import "server-only";

import { resolveSessionTokens } from "@/modules/session/server";

import { RouteError } from "./route";

export async function requireSession() {
  const session = await resolveSessionTokens();
  if (!session) {
    throw new RouteError(401, "SESSION_REQUIRED", "Please sign in to continue.");
  }
  return session;
}
