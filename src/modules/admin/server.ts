import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { BackendClientError, requestBackend } from "@/modules/backend-client/client";
import { readSessionTokens, type CookieStore } from "@/modules/session/cookies";
import type { SessionTokens } from "@/modules/session/types";

import {
  adminAnalyticsSchema,
  adminBookingsPageSchema,
  adminIdentitySchema,
  adminReportsPageSchema,
  adminUsersPageSchema,
} from "./contracts";

export type AdminIdentity = Omit<z.infer<typeof adminIdentitySchema>["user"], "role"> & {
  role: "admin";
};
type AdminContext = { user: AdminIdentity; cookieStore: CookieStore; tokens: SessionTokens };

export class AdminAccessError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminAccessError";
  }
}

export async function getAdminContext(): Promise<AdminContext> {
  const cookieStore = await cookies();
  const tokens = await readSessionTokens(cookieStore);
  if (!tokens) throw new AdminAccessError(401, "Sign in as an administrator to continue.");

  let identity: z.infer<typeof adminIdentitySchema>;
  try {
    identity = await requestBackend({
      path: "auth/me",
      responseSchema: adminIdentitySchema,
      session: { cookieStore, tokens },
    });
  } catch (error) {
    if (error instanceof BackendClientError && [401, 403].includes(error.details.status)) {
      throw new AdminAccessError(error.details.status, error.details.message);
    }
    throw error;
  }

  if (identity.user.role !== "admin") {
    throw new AdminAccessError(403, "This account does not have administrator access.");
  }

  const currentTokens = await readSessionTokens(cookieStore);
  if (!currentTokens) throw new AdminAccessError(401, "Your session has expired. Sign in again.");
  return { user: { ...identity.user, role: "admin" }, cookieStore, tokens: currentTokens };
}

export async function requireAdminPage(): Promise<AdminContext> {
  try {
    return await getAdminContext();
  } catch (error) {
    if (error instanceof AdminAccessError) {
      const params = new URLSearchParams({ returnTo: "/admin" });
      if (error.status === 403) params.set("reason", "forbidden");
      redirect(`/login?${params.toString()}`);
    }
    throw error;
  }
}

async function adminGet<T>(path: string, responseSchema: z.ZodType<T>): Promise<T> {
  const context = await getAdminContext();
  return requestBackend({ path, responseSchema, session: context });
}

export async function getAdminAnalytics(query = "") {
  const suffix = query ? `?${query}` : "";
  return adminGet(`admin/analytics${suffix}`, adminAnalyticsSchema);
}

export async function getAdminUsers(query = "") {
  const suffix = query ? `?${query}` : "";
  return adminGet(`admin/users${suffix}`, adminUsersPageSchema);
}

export async function getAdminBookings(query = "") {
  const suffix = query ? `?${query}` : "";
  return adminGet(`admin/bookings${suffix}`, adminBookingsPageSchema);
}

export async function getAdminReports(query = "") {
  const suffix = query ? `?${query}` : "";
  return adminGet(`admin/reports${suffix}`, adminReportsPageSchema);
}
