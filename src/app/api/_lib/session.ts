import "server-only";

import { requestBackend, type BackendRequest } from "@/modules/backend-client/client";
import { resolveSessionTokens } from "@/modules/session/server";

import { RouteError } from "./route";

export async function requireSession() {
  const session = await resolveSessionTokens();
  if (!session) {
    throw new RouteError(401, "SESSION_REQUIRED", "Please sign in to continue.");
  }
  return session;
}

export async function requestAuthenticatedBackend<T>(
  request: Omit<BackendRequest<T>, "accessToken" | "session">,
): Promise<T> {
  const session = await requireSession();
  return requestBackend({ ...request, session });
}
